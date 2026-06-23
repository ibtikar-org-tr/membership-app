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

function collaboratorsSignature(collaborators: NoteCollaborator[]) {
  return collaborators
    .map((item) => `${item.clientId}:${item.membershipNumber}:${item.displayName}:${item.color}`)
    .join('|')
}

export function useProjectNoteCollaboration({
  noteId,
  membershipNumber,
  displayName,
  enabled,
}: UseProjectNoteCollaborationOptions) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([])
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
  const [awareness, setAwareness] = useState<awarenessProtocol.Awareness | null>(null)
  const [memberColor, setMemberColor] = useState('#64748b')
  const collaboratorsSnapshotRef = useRef('')

  useEffect(() => {
    const token = getAccessToken()

    if (!enabled || !noteId || !token || !membershipNumber) {
      setConnectionState('idle')
      setCollaborators([])
      setYDoc(null)
      setAwareness(null)
      collaboratorsSnapshotRef.current = ''
      return
    }

    const doc = new Yjs.Doc()
    const awarenessInstance = new awarenessProtocol.Awareness(doc)
    const color = colorForMembershipNumber(membershipNumber)

    awarenessInstance.setLocalStateField('user', {
      membershipNumber,
      displayName: displayName ?? membershipNumber,
      color,
    })

    setYDoc(doc)
    setAwareness(awarenessInstance)
    setMemberColor(color)

    const socket = new WebSocket(getProjectNoteWebSocketUrl(noteId, token))
    socket.binaryType = 'arraybuffer'
    setConnectionState('connecting')

    const syncCollaborators = () => {
      const nextCollaborators: NoteCollaborator[] = []

      awarenessInstance.getStates().forEach((state, clientId) => {
        const user = state.user as { membershipNumber?: string; displayName?: string; color?: string } | undefined
        if (!user?.membershipNumber) {
          return
        }

        nextCollaborators.push({
          clientId,
          membershipNumber: user.membershipNumber,
          displayName: user.displayName ?? user.membershipNumber,
          color: user.color ?? colorForMembershipNumber(user.membershipNumber),
        })
      })

      const nextSnapshot = collaboratorsSignature(nextCollaborators)
      if (nextSnapshot === collaboratorsSnapshotRef.current) {
        return
      }

      collaboratorsSnapshotRef.current = nextSnapshot
      setCollaborators(nextCollaborators)
    }

    const handleAwarenessUpdate = (
      changes: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      syncCollaborators()

      if (origin === socket) {
        return
      }

      sendAwarenessUpdate(awarenessInstance, socket, changes.added.concat(changes.updated).concat(changes.removed))
    }

    awarenessInstance.on('update', handleAwarenessUpdate)

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
        awarenessProtocol.applyAwarenessUpdate(awarenessInstance, decoding.readVarUint8Array(decoder), socket)
      }
    }

    socket.addEventListener('open', () => {
      setConnectionState('connected')

      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.writeSyncStep1(encoder, doc)
      socket.send(encoding.toUint8Array(encoder))

      sendAwarenessUpdate(awarenessInstance, socket, [doc.clientID])
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
      awarenessInstance.off('update', handleAwarenessUpdate)
      awarenessInstance.destroy()
      doc.destroy()
      collaboratorsSnapshotRef.current = ''

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }

      setCollaborators([])
      setConnectionState('idle')
      setYDoc(null)
      setAwareness(null)
    }
  }, [displayName, enabled, membershipNumber, noteId])

  return {
    yDoc,
    awareness,
    connectionState,
    collaborators,
    memberColor,
    displayName: displayName ?? membershipNumber ?? '',
  }
}
