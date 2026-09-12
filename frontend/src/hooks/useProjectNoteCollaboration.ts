import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import * as Yjs from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { getProjectNoteWebSocketUrl } from '../api/vms'
import { getAccessToken } from '../utils/auth'
import { colorForMembershipNumber } from '../utils/collaborator-color'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

/** Keepalive interval — proxies often idle-close sockets around 1–5 minutes. */
const KEEPALIVE_MS = 25_000
const RECONNECT_BASE_MS = 800
const RECONNECT_MAX_MS = 12_000

export interface NoteCollaborator {
  clientId: number
  membershipNumber: string
  displayName: string
  color: string
}

interface UseProjectNoteCollaborationOptions {
  noteId: string | null
  membershipNumber: string | null
  displayName: string | null
  resolveMemberDisplayName?: (membershipNumber: string) => string | null | undefined
  enabled: boolean
}

function sendSyncUpdate(doc: Yjs.Doc, socket: WebSocket, update: Uint8Array) {
  if (socket.readyState !== WebSocket.OPEN) {
    return
  }

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeUpdate(encoder, update)
  socket.send(encoding.toUint8Array(encoder))
}

function sendAwarenessUpdate(
  awareness: awarenessProtocol.Awareness,
  socket: WebSocket,
  changedClients: number[],
) {
  if (socket.readyState !== WebSocket.OPEN || changedClients.length === 0) {
    return
  }

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
  )
  socket.send(encoding.toUint8Array(encoder))
}

interface NotePresence {
  membershipNumber: string
  displayName: string
}

function readNotePresence(state: Record<string, unknown>): NotePresence | null {
  const presence = state.notePresence as NotePresence | undefined
  if (presence?.membershipNumber?.trim()) {
    return {
      membershipNumber: presence.membershipNumber.trim(),
      displayName: presence.displayName?.trim() || presence.membershipNumber.trim(),
    }
  }

  const user = state.user as
    | { membershipNumber?: string; displayName?: string; name?: string }
    | undefined

  if (user?.membershipNumber?.trim()) {
    return {
      membershipNumber: user.membershipNumber.trim(),
      displayName: user.displayName?.trim() || user.name?.trim() || user.membershipNumber.trim(),
    }
  }

  return null
}

function setLocalNotePresence(
  awareness: awarenessProtocol.Awareness,
  membershipNumber: string,
  displayName: string,
) {
  awareness.setLocalStateField('notePresence', {
    membershipNumber,
    displayName,
  } satisfies NotePresence)
}

function collaboratorsSignature(collaborators: NoteCollaborator[]) {
  return collaborators
    .map((item) => `${item.clientId}:${item.membershipNumber}:${item.displayName}:${item.color}`)
    .join('|')
}

function reconnectDelay(attempt: number) {
  const exponential = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS)
  const jitter = Math.floor(Math.random() * 300)
  return exponential + jitter
}

export function useProjectNoteCollaboration({
  noteId,
  membershipNumber,
  displayName,
  resolveMemberDisplayName,
  enabled,
}: UseProjectNoteCollaborationOptions) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [isSynced, setIsSynced] = useState(false)
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([])
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [awareness, setAwareness] = useState<awarenessProtocol.Awareness | null>(null)
  const [memberColor, setMemberColor] = useState('#64748b')
  const collaboratorsSnapshotRef = useRef('')
  const resolveMemberDisplayNameRef = useRef(resolveMemberDisplayName)

  resolveMemberDisplayNameRef.current = resolveMemberDisplayName

  useEffect(() => {
    if (!enabled || !noteId || !membershipNumber) {
      setConnectionState('idle')
      setIsSynced(false)
      setCollaborators([])
      setYDoc(null)
      setAwareness(null)
      collaboratorsSnapshotRef.current = ''
      return
    }

    let disposed = false
    let activeSocket: WebSocket | null = null
    let reconnectAttempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let keepaliveTimer: ReturnType<typeof setInterval> | null = null
    let hasConnectedOnce = false

    const doc = new Yjs.Doc()
    const awarenessInstance = new awarenessProtocol.Awareness(doc)
    const color = colorForMembershipNumber(membershipNumber)
    const localDisplayName = displayName ?? membershipNumber

    setLocalNotePresence(awarenessInstance, membershipNumber, localDisplayName)

    setYDoc(doc)
    setAwareness(awarenessInstance)
    setMemberColor(color)
    setConnectionState('connecting')
    setIsSynced(false)

    const syncCollaborators = () => {
      const nextCollaborators: NoteCollaborator[] = []

      awarenessInstance.getStates().forEach((state, clientId) => {
        const presence = readNotePresence(state as Record<string, unknown>)
        if (!presence) {
          return
        }

        const resolvedDisplayName =
          resolveMemberDisplayNameRef.current?.(presence.membershipNumber)?.trim() ||
          presence.displayName ||
          presence.membershipNumber

        nextCollaborators.push({
          clientId,
          membershipNumber: presence.membershipNumber,
          displayName: resolvedDisplayName,
          color: colorForMembershipNumber(presence.membershipNumber),
        })
      })

      const nextSnapshot = collaboratorsSignature(nextCollaborators)
      if (nextSnapshot === collaboratorsSnapshotRef.current) {
        return
      }

      collaboratorsSnapshotRef.current = nextSnapshot
      setCollaborators(nextCollaborators)
    }

    syncCollaborators()

    const clearKeepalive = () => {
      if (keepaliveTimer) {
        clearInterval(keepaliveTimer)
        keepaliveTimer = null
      }
    }

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const startKeepalive = () => {
      clearKeepalive()
      keepaliveTimer = setInterval(() => {
        if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
          return
        }

        // Awareness tick keeps the socket (and room) active without mutating the doc.
        sendAwarenessUpdate(awarenessInstance, activeSocket, [doc.clientID])
      }, KEEPALIVE_MS)
    }

    const handleAwarenessUpdate = (
      changes: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      syncCollaborators()

      if (!activeSocket || origin === activeSocket) {
        return
      }

      sendAwarenessUpdate(
        awarenessInstance,
        activeSocket,
        changes.added.concat(changes.updated).concat(changes.removed),
      )
    }

    awarenessInstance.on('update', handleAwarenessUpdate)

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (!activeSocket || origin === activeSocket) {
        return
      }

      sendSyncUpdate(doc, activeSocket, update)
    }

    doc.on('update', handleDocUpdate)

    const handleSocketMessage = (event: MessageEvent<ArrayBuffer | string>) => {
      if (!activeSocket) {
        return
      }

      const payload =
        event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : new TextEncoder().encode(String(event.data))
      const decoder = decoding.createDecoder(payload)
      const messageType = decoding.readVarUint(decoder)

      if (messageType === MESSAGE_SYNC) {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, activeSocket)
        const response = encoding.toUint8Array(encoder)
        if (response.length > 1 && activeSocket.readyState === WebSocket.OPEN) {
          activeSocket.send(response)
        }

        // Sync step 2 means the remote state was applied — safe to seed empty rooms from SQL.
        if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
          setIsSynced(true)
        }
        return
      }

      if (messageType === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(awarenessInstance, decoding.readVarUint8Array(decoder), activeSocket)
      }
    }

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) {
        return
      }

      const delay = reconnectDelay(reconnectAttempt)
      reconnectAttempt += 1
      setConnectionState(hasConnectedOnce ? 'connecting' : 'error')

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        openSocket()
      }, delay)
    }

    const openSocket = () => {
      if (disposed) {
        return
      }

      const token = getAccessToken()
      if (!token) {
        setConnectionState('error')
        scheduleReconnect()
        return
      }

      clearReconnectTimer()
      clearKeepalive()
      setIsSynced(false)

      if (activeSocket) {
        activeSocket.removeEventListener('message', handleSocketMessage)
        activeSocket.onopen = null
        activeSocket.onclose = null
        activeSocket.onerror = null
        if (activeSocket.readyState === WebSocket.OPEN || activeSocket.readyState === WebSocket.CONNECTING) {
          activeSocket.close()
        }
        activeSocket = null
      }

      setConnectionState('connecting')

      const socket = new WebSocket(getProjectNoteWebSocketUrl(noteId, token))
      socket.binaryType = 'arraybuffer'
      activeSocket = socket

      socket.addEventListener('message', handleSocketMessage)

      socket.addEventListener('open', () => {
        if (disposed || activeSocket !== socket) {
          return
        }

        hasConnectedOnce = true
        reconnectAttempt = 0
        setConnectionState('connected')
        setLocalNotePresence(awarenessInstance, membershipNumber, localDisplayName)

        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        syncProtocol.writeSyncStep1(encoder, doc)
        socket.send(encoding.toUint8Array(encoder))

        sendAwarenessUpdate(awarenessInstance, socket, [doc.clientID])
        syncCollaborators()
        startKeepalive()
      })

      socket.addEventListener('close', () => {
        if (activeSocket !== socket) {
          return
        }

        activeSocket = null
        clearKeepalive()
        setIsSynced(false)

        if (disposed) {
          return
        }

        scheduleReconnect()
      })

      socket.addEventListener('error', () => {
        if (activeSocket !== socket || disposed) {
          return
        }

        // `close` follows and schedules reconnect; surface error if we never connected.
        if (!hasConnectedOnce) {
          setConnectionState('error')
        }
      })
    }

    openSocket()

    return () => {
      disposed = true
      clearKeepalive()
      clearReconnectTimer()

      doc.off('update', handleDocUpdate)
      awarenessInstance.off('update', handleAwarenessUpdate)
      awarenessInstance.destroy()
      doc.destroy()
      collaboratorsSnapshotRef.current = ''

      if (activeSocket) {
        activeSocket.removeEventListener('message', handleSocketMessage)
        activeSocket.onopen = null
        activeSocket.onclose = null
        activeSocket.onerror = null
        if (activeSocket.readyState === WebSocket.OPEN || activeSocket.readyState === WebSocket.CONNECTING) {
          activeSocket.close()
        }
        activeSocket = null
      }

      setCollaborators([])
      setConnectionState('idle')
      setIsSynced(false)
      setYDoc(null)
      setAwareness(null)
    }
  }, [displayName, enabled, membershipNumber, noteId])

  return {
    yDoc,
    awareness,
    connectionState,
    isSynced,
    collaborators,
    memberColor,
    displayName: displayName ?? membershipNumber ?? '',
  }
}
