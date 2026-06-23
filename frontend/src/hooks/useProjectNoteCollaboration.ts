import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import * as Yjs from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { getProjectNoteWebSocketUrl } from '../api/vms'
import { getAccessToken } from '../utils/auth'

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

function colorForMembershipNumber(membershipNumber: string) {
  let hash = 0
  for (let index = 0; index < membershipNumber.length; index += 1) {
    hash = membershipNumber.charCodeAt(index) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 70% 45%)`
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

export function useProjectNoteCollaboration({
  noteId,
  membershipNumber,
  displayName,
  enabled,
}: UseProjectNoteCollaborationOptions) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([])
  const [yText, setYText] = useState<Y.Text | null>(null)
  const docRef = useRef<Yjs.Doc | null>(null)

  useEffect(() => {
    const token = getAccessToken()

    if (!enabled || !noteId || !token || !membershipNumber) {
      setConnectionState('idle')
      setCollaborators([])
      setYText(null)
      return
    }

    const doc = new Yjs.Doc()
    docRef.current = doc
    const text = doc.getText('content')
    setYText(text)

    const awareness = new awarenessProtocol.Awareness(doc)
    awareness.setLocalStateField('user', {
      membershipNumber,
      displayName: displayName ?? membershipNumber,
      color: colorForMembershipNumber(membershipNumber),
    })

    const socket = new WebSocket(getProjectNoteWebSocketUrl(noteId, token))
    socket.binaryType = 'arraybuffer'
    setConnectionState('connecting')

    const updateCollaborators = () => {
      const nextCollaborators: NoteCollaborator[] = []

      awareness.getStates().forEach((state, clientId) => {
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

      setCollaborators(nextCollaborators)
    }

    awareness.on('update', updateCollaborators)

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
      awareness.off('update', updateCollaborators)
      awareness.destroy()
      doc.destroy()
      docRef.current = null

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }

      setCollaborators([])
      setConnectionState('idle')
      setYText(null)
    }
  }, [displayName, enabled, membershipNumber, noteId])

  return {
    yText,
    connectionState,
    collaborators,
  }
}
