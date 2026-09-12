import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import * as Yjs from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { getProjectNotesRoomWebSocketUrl } from '../api/vms'
import { getAccessToken } from '../utils/auth'
import { colorForMembershipNumber } from '../utils/collaborator-color'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const MESSAGE_CONTROL = 2

const KEEPALIVE_MS = 25_000
const RECONNECT_BASE_MS = 800
const RECONNECT_MAX_MS = 12_000

export interface NoteCollaborator {
  clientId: number
  membershipNumber: string
  displayName: string
  color: string
}

export interface ProjectNotePresenceViewer {
  membershipNumber: string
  displayName: string
  noteId: string | null
  color: string
}

interface UseProjectNoteCollaborationOptions {
  projectId: string | null
  noteId: string | null
  contentType?: 'html' | 'markdown' | null
  membershipNumber: string | null
  displayName: string | null
  resolveMemberDisplayName?: (membershipNumber: string) => string | null | undefined
  enabled: boolean
}

interface NotePresence {
  membershipNumber: string
  displayName: string
}

function sendControl(socket: WebSocket, payload: Record<string, unknown>) {
  if (socket.readyState !== WebSocket.OPEN) {
    return
  }

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_CONTROL)
  encoding.writeVarString(encoder, JSON.stringify(payload))
  socket.send(encoding.toUint8Array(encoder))
}

function sendSyncUpdate(noteId: string, socket: WebSocket, update: Uint8Array) {
  if (socket.readyState !== WebSocket.OPEN) {
    return
  }

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  encoding.writeVarString(encoder, noteId)
  syncProtocol.writeUpdate(encoder, update)
  socket.send(encoding.toUint8Array(encoder))
}

function sendAwarenessUpdate(
  noteId: string,
  awareness: awarenessProtocol.Awareness,
  socket: WebSocket,
  changedClients: number[],
) {
  if (socket.readyState !== WebSocket.OPEN || changedClients.length === 0) {
    return
  }

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
  encoding.writeVarString(encoder, noteId)
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
  )
  socket.send(encoding.toUint8Array(encoder))
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

function presenceSignature(viewers: ProjectNotePresenceViewer[]) {
  return viewers
    .map((item) => `${item.membershipNumber}:${item.noteId ?? ''}:${item.displayName}`)
    .join('|')
}

function reconnectDelay(attempt: number) {
  const exponential = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS)
  const jitter = Math.floor(Math.random() * 300)
  return exponential + jitter
}

export function useProjectNoteCollaboration({
  projectId,
  noteId,
  contentType = null,
  membershipNumber,
  displayName,
  resolveMemberDisplayName,
  enabled,
}: UseProjectNoteCollaborationOptions) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [isSynced, setIsSynced] = useState(false)
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([])
  const [presenceViewers, setPresenceViewers] = useState<ProjectNotePresenceViewer[]>([])
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [awareness, setAwareness] = useState<awarenessProtocol.Awareness | null>(null)
  const [memberColor, setMemberColor] = useState('#64748b')

  const collaboratorsSnapshotRef = useRef('')
  const presenceSnapshotRef = useRef('')
  const resolveMemberDisplayNameRef = useRef(resolveMemberDisplayName)
  const noteIdRef = useRef(noteId)
  const contentTypeRef = useRef(contentType)
  const membershipNumberRef = useRef(membershipNumber)
  const displayNameRef = useRef(displayName)
  const socketRef = useRef<WebSocket | null>(null)
  const docRef = useRef<Yjs.Doc | null>(null)
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null)
  const focusGenerationRef = useRef(0)

  resolveMemberDisplayNameRef.current = resolveMemberDisplayName
  noteIdRef.current = noteId
  contentTypeRef.current = contentType
  membershipNumberRef.current = membershipNumber
  displayNameRef.current = displayName

  const applyPresence = (viewers: Array<{ membershipNumber: string; displayName: string; noteId: string | null }>) => {
    const next: ProjectNotePresenceViewer[] = viewers.map((viewer) => {
      const number = viewer.membershipNumber.trim()
      return {
        membershipNumber: number,
        displayName:
          resolveMemberDisplayNameRef.current?.(number)?.trim() || viewer.displayName?.trim() || number,
        noteId: viewer.noteId?.trim() || null,
        color: colorForMembershipNumber(number),
      }
    })

    const nextSnapshot = presenceSignature(next)
    if (nextSnapshot === presenceSnapshotRef.current) {
      return
    }

    presenceSnapshotRef.current = nextSnapshot
    setPresenceViewers(next)
  }

  const syncCollaboratorsFrom = (awarenessInstance: awarenessProtocol.Awareness) => {
    const nextCollaborators: NoteCollaborator[] = []

    awarenessInstance.getStates().forEach((state, clientId) => {
      const presence = readNotePresence(state as Record<string, unknown>)
      if (!presence) {
        return
      }

      nextCollaborators.push({
        clientId,
        membershipNumber: presence.membershipNumber,
        displayName:
          resolveMemberDisplayNameRef.current?.(presence.membershipNumber)?.trim() ||
          presence.displayName ||
          presence.membershipNumber,
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

  const tearDownFocusedNote = () => {
    focusGenerationRef.current += 1
    const awarenessInstance = awarenessRef.current
    const doc = docRef.current
    if (awarenessInstance) {
      awarenessInstance.destroy()
    }
    if (doc) {
      doc.destroy()
    }
    awarenessRef.current = null
    docRef.current = null
    setAwareness(null)
    setYDoc(null)
    setIsSynced(false)
    setCollaborators([])
    collaboratorsSnapshotRef.current = ''
  }

  const focusNoteOnSocket = (socket: WebSocket) => {
    const focusedNoteId = noteIdRef.current
    const focusedContentType = contentTypeRef.current === 'markdown' ? 'markdown' : 'html'
    const member = membershipNumberRef.current
    const localDisplayName = displayNameRef.current ?? member

    tearDownFocusedNote()

    if (!member) {
      return
    }

    if (!focusedNoteId) {
      sendControl(socket, { type: 'focus', noteId: null })
      return
    }

    const generation = focusGenerationRef.current
    const doc = new Yjs.Doc()
    const awarenessInstance = new awarenessProtocol.Awareness(doc)
    setLocalNotePresence(awarenessInstance, member, localDisplayName ?? member)

    docRef.current = doc
    awarenessRef.current = awarenessInstance
    setYDoc(doc)
    setAwareness(awarenessInstance)

    const handleAwarenessUpdate = (
      changes: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      if (generation !== focusGenerationRef.current) {
        return
      }
      syncCollaboratorsFrom(awarenessInstance)
      if (!socketRef.current || origin === socketRef.current) {
        return
      }
      sendAwarenessUpdate(
        focusedNoteId,
        awarenessInstance,
        socketRef.current,
        changes.added.concat(changes.updated).concat(changes.removed),
      )
    }

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (generation !== focusGenerationRef.current) {
        return
      }
      if (!socketRef.current || origin === socketRef.current) {
        return
      }
      sendSyncUpdate(focusedNoteId, socketRef.current, update)
    }

    awarenessInstance.on('update', handleAwarenessUpdate)
    doc.on('update', handleDocUpdate)

    sendControl(socket, {
      type: 'focus',
      noteId: focusedNoteId,
      contentType: focusedContentType,
    })

    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    encoding.writeVarString(encoder, focusedNoteId)
    syncProtocol.writeSyncStep1(encoder, doc)
    socket.send(encoding.toUint8Array(encoder))
    sendAwarenessUpdate(focusedNoteId, awarenessInstance, socket, [doc.clientID])
    syncCollaboratorsFrom(awarenessInstance)
  }

  // Project socket lifecycle.
  useEffect(() => {
    if (!enabled || !projectId || !membershipNumber) {
      setConnectionState('idle')
      setIsSynced(false)
      setCollaborators([])
      setPresenceViewers([])
      tearDownFocusedNote()
      presenceSnapshotRef.current = ''
      socketRef.current = null
      return
    }

    let disposed = false
    let activeSocket: WebSocket | null = null
    let reconnectAttempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let keepaliveTimer: ReturnType<typeof setInterval> | null = null
    let hasConnectedOnce = false

    setMemberColor(colorForMembershipNumber(membershipNumber))
    setConnectionState('connecting')

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
        const socket = socketRef.current
        const doc = docRef.current
        const awarenessInstance = awarenessRef.current
        const focusedNoteId = noteIdRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          return
        }

        if (focusedNoteId && doc && awarenessInstance) {
          sendAwarenessUpdate(focusedNoteId, awarenessInstance, socket, [doc.clientID])
          return
        }

        sendControl(socket, { type: 'focus', noteId: null })
      }, KEEPALIVE_MS)
    }

    const handleSocketMessage = (event: MessageEvent<ArrayBuffer | string>) => {
      const socket = socketRef.current
      if (!socket) {
        return
      }

      const payload =
        event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : new TextEncoder().encode(String(event.data))
      const decoder = decoding.createDecoder(payload)
      const messageType = decoding.readVarUint(decoder)

      if (messageType === MESSAGE_CONTROL) {
        try {
          const raw = decoding.readVarString(decoder)
          const parsed = JSON.parse(raw) as {
            type?: string
            viewers?: Array<{ membershipNumber: string; displayName: string; noteId: string | null }>
          }
          if (parsed.type === 'presence' && Array.isArray(parsed.viewers)) {
            applyPresence(parsed.viewers)
          }
        } catch {
          // ignore
        }
        return
      }

      const messageNoteId = decoding.readVarString(decoder)
      if (!noteIdRef.current || messageNoteId !== noteIdRef.current) {
        return
      }

      const doc = docRef.current
      const awarenessInstance = awarenessRef.current
      if (!doc || !awarenessInstance) {
        return
      }

      if (messageType === MESSAGE_SYNC) {
        const headerEncoder = encoding.createEncoder()
        encoding.writeVarUint(headerEncoder, MESSAGE_SYNC)
        encoding.writeVarString(headerEncoder, messageNoteId)
        const headerLength = encoding.toUint8Array(headerEncoder).length

        const responseEncoder = encoding.createEncoder()
        encoding.writeVarUint(responseEncoder, MESSAGE_SYNC)
        encoding.writeVarString(responseEncoder, messageNoteId)
        const syncMessageType = syncProtocol.readSyncMessage(decoder, responseEncoder, doc, socket)
        const response = encoding.toUint8Array(responseEncoder)
        if (response.length > headerLength && socket.readyState === WebSocket.OPEN) {
          socket.send(response)
        }

        if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
          setIsSynced(true)
        }
        return
      }

      if (messageType === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(awarenessInstance, decoding.readVarUint8Array(decoder), socket)
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
        socketRef.current = null
      }

      setConnectionState('connecting')
      const socket = new WebSocket(getProjectNotesRoomWebSocketUrl(projectId, token))
      socket.binaryType = 'arraybuffer'
      activeSocket = socket
      socketRef.current = socket
      socket.addEventListener('message', handleSocketMessage)

      socket.addEventListener('open', () => {
        if (disposed || activeSocket !== socket) {
          return
        }

        hasConnectedOnce = true
        reconnectAttempt = 0
        setConnectionState('connected')
        focusNoteOnSocket(socket)
        startKeepalive()
      })

      socket.addEventListener('close', () => {
        if (activeSocket !== socket) {
          return
        }

        activeSocket = null
        socketRef.current = null
        clearKeepalive()
        setIsSynced(false)

        if (!disposed) {
          scheduleReconnect()
        }
      })

      socket.addEventListener('error', () => {
        if (activeSocket === socket && !disposed && !hasConnectedOnce) {
          setConnectionState('error')
        }
      })
    }

    openSocket()

    return () => {
      disposed = true
      clearKeepalive()
      clearReconnectTimer()
      tearDownFocusedNote()
      presenceSnapshotRef.current = ''

      if (activeSocket) {
        activeSocket.removeEventListener('message', handleSocketMessage)
        activeSocket.onopen = null
        activeSocket.onclose = null
        activeSocket.onerror = null
        if (activeSocket.readyState === WebSocket.OPEN || activeSocket.readyState === WebSocket.CONNECTING) {
          activeSocket.close()
        }
      }

      socketRef.current = null
      setCollaborators([])
      setPresenceViewers([])
      setConnectionState('idle')
      setIsSynced(false)
      setYDoc(null)
      setAwareness(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus uses refs; socket only remounts on project/auth
  }, [enabled, membershipNumber, projectId])

  // Refocus when the selected note changes (reuse open socket).
  useEffect(() => {
    const socket = socketRef.current
    if (!enabled || !projectId || !membershipNumber) {
      return
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    focusNoteOnSocket(socket)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, noteId])

  return {
    yDoc,
    awareness,
    connectionState,
    isSynced,
    collaborators,
    presenceViewers,
    memberColor,
    displayName: displayName ?? membershipNumber ?? '',
  }
}
