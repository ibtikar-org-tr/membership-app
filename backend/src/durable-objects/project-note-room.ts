import { DurableObject } from 'cloudflare:workers'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import { getProjectNoteById, updateProjectNoteContent } from '../repositories/vms-project-notes.repository'
import type { AppBindings } from '../types/bindings'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const PERSIST_DEBOUNCE_MS = 1500

function createContentPreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return null
  }

  return normalized.length > 200 ? `${normalized.slice(0, 197)}...` : normalized
}

export class ProjectNoteRoom extends DurableObject<AppBindings> {
  private doc: Y.Doc | null = null
  private awareness: awarenessProtocol.Awareness | null = null
  private clients = new Set<WebSocket>()
  private awarenessIdsBySocket = new Map<WebSocket, Set<number>>()
  private noteId: string | null = null
  private initialized = false
  private persistTimeout: ReturnType<typeof setTimeout> | null = null

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade.', { status: 426 })
    }

    this.noteId = url.searchParams.get('noteId')?.trim() || null
    if (!this.noteId) {
      return new Response('Missing note id.', { status: 400 })
    }

    await this.ensureInitialized(this.noteId)

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    this.ctx.acceptWebSocket(server)
    this.clients.add(server)
    this.awarenessIdsBySocket.set(server, new Set())

    this.sendSyncStep1(server)
    this.sendAwarenessSnapshot(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (!this.doc || !this.awareness) {
      return
    }

    const data = typeof message === 'string' ? new TextEncoder().encode(message) : new Uint8Array(message)
    const decoder = decoding.createDecoder(data)
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case MESSAGE_SYNC: {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        syncProtocol.readSyncMessage(decoder, encoder, this.doc, ws)
        const response = encoding.toUint8Array(encoder)
        if (response.length > 1) {
          ws.send(response)
        }
        break
      }
      case MESSAGE_AWARENESS: {
        const update = decoding.readVarUint8Array(decoder)
        const controlledIds = this.awarenessIdsBySocket.get(ws) ?? new Set<number>()
        const before = new Set(this.awareness.getStates().keys())
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, ws)
        const after = this.awareness.getStates().keys()
        for (const clientId of after) {
          if (!before.has(clientId)) {
            controlledIds.add(clientId)
          }
        }
        this.awarenessIdsBySocket.set(ws, controlledIds)
        break
      }
      default:
        break
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.removeClient(ws)
  }

  async webSocketError(ws: WebSocket) {
    this.removeClient(ws)
  }

  private async ensureInitialized(noteId: string) {
    if (this.initialized) {
      return
    }

    await this.ctx.blockConcurrencyWhile(async () => {
      this.doc = new Y.Doc()
      this.awareness = new awarenessProtocol.Awareness(this.doc)

      const storedState = await this.ctx.storage.get<ArrayBuffer>('yjs-state')
      if (storedState) {
        Y.applyUpdate(this.doc, new Uint8Array(storedState))
      } else {
        const note = await getProjectNoteById(this.env.VMS_DB, noteId)
        if (note?.content) {
          this.doc.getText('content').insert(0, note.content)
          await this.persistDocState(noteId, false)
        }
      }

      this.doc.on('update', (update: Uint8Array, origin: unknown) => {
        this.broadcastUpdate(update, origin)
        this.schedulePersist(noteId)
      })

      this.awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
        const changedClients = added.concat(updated).concat(removed)
        if (changedClients.length === 0) {
          return
        }

        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness!, changedClients),
        )
        this.broadcast(encoding.toUint8Array(encoder), origin)
      })

      this.initialized = true
    })
  }

  private sendSyncStep1(socket: WebSocket) {
    if (!this.doc) {
      return
    }

    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(encoder, this.doc)
    socket.send(encoding.toUint8Array(encoder))
  }

  private sendAwarenessSnapshot(socket: WebSocket) {
    if (!this.awareness) {
      return
    }

    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, Array.from(this.awareness.getStates().keys())),
    )
    socket.send(encoding.toUint8Array(encoder))
  }

  private broadcastUpdate(update: Uint8Array, origin: unknown) {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    this.broadcast(encoding.toUint8Array(encoder), origin)
  }

  private broadcast(message: Uint8Array, origin: unknown) {
    for (const socket of this.clients) {
      if (socket !== origin && socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    }
  }

  private removeClient(socket: WebSocket) {
    const controlledIds = this.awarenessIdsBySocket.get(socket)
    if (controlledIds && controlledIds.size > 0 && this.awareness) {
      awarenessProtocol.removeAwarenessStates(this.awareness, Array.from(controlledIds), socket)
    }

    this.awarenessIdsBySocket.delete(socket)
    this.clients.delete(socket)
  }

  private schedulePersist(noteId: string) {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout)
    }

    this.persistTimeout = setTimeout(() => {
      void this.persistDocState(noteId, true)
    }, PERSIST_DEBOUNCE_MS)
  }

  private async persistDocState(noteId: string, writeSql: boolean) {
    if (!this.doc) {
      return
    }

    const state = Y.encodeStateAsUpdate(this.doc)
    await this.ctx.storage.put('yjs-state', state.buffer.slice(state.byteOffset, state.byteOffset + state.byteLength))

    if (!writeSql) {
      return
    }

    const content = this.doc.getText('content').toString()
    await updateProjectNoteContent(this.env.VMS_DB, noteId, content, createContentPreview(content))
  }
}

export type ProjectNoteRoomStub = DurableObjectStub<ProjectNoteRoom>
