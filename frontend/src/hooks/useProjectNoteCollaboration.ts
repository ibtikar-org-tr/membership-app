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

export interface NoteCollaborator {
  clientId: number
  membershipNumber: string
  displayName: string
  color: string
}

export interface NoteRemoteCursor {
  clientId: number
  membershipNumber: string
  displayName: string
  color: string
  anchor: number
  head: number
}

interface UseProjectNoteCollaborationOptions {
  noteId: string | null
  membershipNumber: string | null
  displayName: string | null
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

function awarenessSnapshotSignature(
  collaborators: NoteCollaborator[],
  remoteCursors: NoteRemoteCursor[],
) {
  const collaboratorPart = collaborators
    .map((item) => `${item.clientId}:${item.membershipNumber}:${item.displayName}:${item.color}`)
    .join('|')
  const cursorPart = remoteCursors
    .map((item) => `${item.clientId}:${item.anchor}:${item.head}:${item.color}`)
    .join('|')

  return `${collaboratorPart}::${cursorPart}`
}

export function useProjectNoteCollaboration({
  noteId,
  membershipNumber,
  displayName,
  enabled,
}: UseProjectNoteCollaborationOptions) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([])
  const [remoteCursors, setRemoteCursors] = useState<NoteRemoteCursor[]>([])
  const [yText, setYText] = useState<Y.Text | null>(null)
  const docRef = useRef<Yjs.Doc | null>(null)
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null)
  const localClientIdRef = useRef<number | null>(null)
  const awarenessSnapshotRef = useRef('')

  const updateLocalCursor = (anchor: number, head: number) => {
    awarenessRef.current?.setLocalStateField('cursor', {
      anchor: Math.max(0, anchor),
      head: Math.max(0, head),
    })
  }

  useEffect(() => {
    const token = getAccessToken()

    if (!enabled || !noteId || !token || !membershipNumber) {
      setConnectionState('idle')
      setCollaborators([])
      setRemoteCursors([])
      setYText(null)
      awarenessRef.current = null
      localClientIdRef.current = null
      awarenessSnapshotRef.current = ''
      return
    }

    const doc = new Yjs.Doc()
    docRef.current = doc
    localClientIdRef.current = doc.clientID

    const text = doc.getText('content')
    setYText(text)

    const awareness = new awarenessProtocol.Awareness(doc)
    awarenessRef.current = awareness

    const memberColor = colorForMembershipNumber(membershipNumber)
    awareness.setLocalStateField('user', {
      membershipNumber,
      displayName: displayName ?? membershipNumber,
      color: memberColor,
    })

    const socket = new WebSocket(getProjectNoteWebSocketUrl(noteId, token))
    socket.binaryType = 'arraybuffer'
    setConnectionState('connecting')

    const syncAwarenessState = () => {
      const nextCollaborators: NoteCollaborator[] = []
      const nextRemoteCursors: NoteRemoteCursor[] = []
      const localClientId = localClientIdRef.current

      awareness.getStates().forEach((state, clientId) => {
        const user = state.user as { membershipNumber?: string; displayName?: string; color?: string } | undefined
        if (!user?.membershipNumber) {
          return
        }

        const color = user.color ?? colorForMembershipNumber(user.membershipNumber)
        const collaboratorDisplayName = user.displayName ?? user.membershipNumber

        nextCollaborators.push({
          clientId,
          membershipNumber: user.membershipNumber,
          displayName: collaboratorDisplayName,
          color,
        })

        if (clientId === localClientId) {
          return
        }

        const cursor = state.cursor as { anchor?: number; head?: number } | undefined
        if (typeof cursor?.anchor !== 'number') {
          return
        }

        nextRemoteCursors.push({
          clientId,
          membershipNumber: user.membershipNumber,
          displayName: collaboratorDisplayName,
          color,
          anchor: cursor.anchor,
          head: typeof cursor.head === 'number' ? cursor.head : cursor.anchor,
        })
      })

      const nextSnapshot = awarenessSnapshotSignature(nextCollaborators, nextRemoteCursors)
      if (nextSnapshot === awarenessSnapshotRef.current) {
        return
      }

      awarenessSnapshotRef.current = nextSnapshot
      setCollaborators(nextCollaborators)
      setRemoteCursors(nextRemoteCursors)
    }

    awareness.on('update', syncAwarenessState)

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === socket) {
        return
      }

      sendSyncUpdate(doc, socket, update)
    }

    doc.on('update', handleDocUpdate)

    const handleSocketMessage = (event: MessageEvent<ArrayBuffer | string>) => {
      const payload =
        event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : new TextEncoder().encode(String(event.data))
      const decoder = decoding.createDecoder(payload)
      const messageType = decoding.readVarUint(decoder)

      if (messageType === MESSAGE_SYNC) {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        syncProtocol.readSyncMessage(decoder, encoder, doc, socket)
        const response = encoding.toUint8Array(encoder)
        if (response.length > 1) {
          socket.send(response)
        }
        return
      }

      if (messageType === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), socket)
      }
    }

    socket.addEventListener('open', () => {
      setConnectionState('connected')

      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.writeSyncStep1(encoder, doc)
      socket.send(encoding.toUint8Array(encoder))

      const awarenessEncoder = encoding.createEncoder()
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS)
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, [doc.clientID]),
      )
      socket.send(encoding.toUint8Array(awarenessEncoder))
    })

    socket.addEventListener('message', handleSocketMessage)

    socket.addEventListener('close', () => {
      setConnectionState('idle')
    })

    socket.addEventListener('error', () => {
      setConnectionState('error')
    })

    return () => {
      doc.off('update', handleDocUpdate)
      awareness.off('update', syncAwarenessState)
      awareness.destroy()
      doc.destroy()
      docRef.current = null
      awarenessRef.current = null
      localClientIdRef.current = null
      awarenessSnapshotRef.current = ''

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }

      setCollaborators([])
      setRemoteCursors([])
      setConnectionState('idle')
      setYText(null)
    }
  }, [displayName, enabled, membershipNumber, noteId])

  return {
    yText,
    connectionState,
    collaborators,
    remoteCursors,
    updateLocalCursor,
  }
}
