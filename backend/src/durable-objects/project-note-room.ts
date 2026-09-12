import { DurableObject } from 'cloudflare:workers'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import { updateProjectNoteContent } from '../repositories/vms-project-notes.repository'
import type { AppBindings } from '../types/bindings'
import { extractMarkdownNoteContent, extractNoteContent } from '../utils/yjs-rich-text'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const SQL_PERSIST_DEBOUNCE_MS = 1500

type NoteContentType = 'html' | 'markdown'

interface SocketAttachment {
  noteId: string
  awarenessIds: number[]
}

export class ProjectNoteRoom extends DurableObject<AppBindings> {
  private doc: Y.Doc | null = null
  private awareness: awarenessProtocol.Awareness | null = null
  private noteId: string | null = null
  private contentType: NoteContentType = 'html'
  private initialized = false
  private yjsPersistChain: Promise<void> = Promise.resolve()

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade.', { status: 426 })
    }

    this.noteId = url.searchParams.get('noteId')?.trim() || null
    if (!this.noteId) {
      return new Response('Missing note id.', { status: 400 })
    }

    const contentTypeParam = url.searchParams.get('contentType')?.trim()
    this.contentType = contentTypeParam === 'markdown' ? 'markdown' : 'html'

    await this.ctx.storage.put('note-id', this.noteId)
    await this.ctx.storage.put('content-type', this.contentType)
    await this.ensureInitialized(this.noteId)

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({
      noteId: this.noteId,
      awarenessIds: [],
    } satisfies SocketAttachment)

    this.sendSyncStep1(server)
    this.sendAwarenessSnapshot(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const noteId = await this.ensureReadyForSocket(ws)
    if (!noteId || !this.doc || !this.awareness) {
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
        const attachment = this.readAttachment(ws)
        const controlledIds = new Set(attachment?.awarenessIds ?? [])
        const before = new Set(this.awareness.getStates().keys())
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, ws)
        for (const clientId of this.awareness.getStates().keys()) {
          if (!before.has(clientId)) {
            controlledIds.add(clientId)
          }
        }
        this.writeAttachment(ws, {
          noteId,
          awarenessIds: Array.from(controlledIds),
        })
        break
      }
      default:
        break
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.ensureReadyForSocket(ws)
    await this.removeClient(ws)
  }

  async webSocketError(ws: WebSocket) {
    await this.ensureReadyForSocket(ws)
    await this.removeClient(ws)
  }

  async alarm() {
    const noteId =
      (await this.ctx.storage.get<string>('pending-sql-note-id')) ??
      this.noteId ??
      (await this.ctx.storage.get<string>('note-id'))

    if (!noteId) {
      return
    }

    this.noteId = noteId
    const storedType = await this.ctx.storage.get<string>('content-type')
    if (storedType === 'markdown' || storedType === 'html') {
      this.contentType = storedType
    }
    await this.ensureInitialized(noteId)
    await this.yjsPersistChain
    await this.persistSql(noteId)
    await this.ctx.storage.delete('pending-sql-note-id')
  }

  private async ensureReadyForSocket(ws: WebSocket) {
    const attachment = this.readAttachment(ws)
    const noteId =
      attachment?.noteId ?? this.noteId ?? (await this.ctx.storage.get<string>('note-id')) ?? null

    if (!noteId) {
      return null
    }

    this.noteId = noteId
    const storedType = await this.ctx.storage.get<string>('content-type')
    if (storedType === 'markdown' || storedType === 'html') {
      this.contentType = storedType
    }
    await this.ensureInitialized(noteId)
    return noteId
  }

  private readAttachment(ws: WebSocket): SocketAttachment | null {
    const value = ws.deserializeAttachment() as SocketAttachment | null
    if (!value?.noteId) {
      return null
    }

    return {
      noteId: value.noteId,
      awarenessIds: Array.isArray(value.awarenessIds) ? value.awarenessIds : [],
    }
  }

  private writeAttachment(ws: WebSocket, attachment: SocketAttachment) {
    ws.serializeAttachment(attachment)
  }

  private async ensureInitialized(noteId: string) {
    if (this.initialized && this.doc && this.awareness) {
      return
    }

    await this.ctx.blockConcurrencyWhile(async () => {
      if (this.initialized && this.doc && this.awareness) {
        return
      }

      this.doc = new Y.Doc()
      this.awareness = new awarenessProtocol.Awareness(this.doc)

      const storedState = await this.ctx.storage.get<ArrayBuffer>('yjs-state')
      if (storedState) {
        Y.applyUpdate(this.doc, new Uint8Array(storedState))
      }

      this.doc.on('update', (update: Uint8Array, origin: unknown) => {
        this.broadcastUpdate(update, origin)
        this.queueYjsPersist()
        this.scheduleSqlPersist(noteId)
      })

      this.awareness.on(
        'update',
        (
          { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
          origin: unknown,
        ) => {
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
        },
      )

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
    // Always use hibernation-aware socket list — in-memory Sets are lost after eviction.
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== origin && socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    }
  }

  private async removeClient(ws: WebSocket) {
    const attachment = this.readAttachment(ws)
    if (attachment?.awarenessIds.length && this.awareness) {
      awarenessProtocol.removeAwarenessStates(this.awareness, attachment.awarenessIds, ws)
    }

    // Flush durable state when the last collaborator leaves.
    if (this.ctx.getWebSockets().length <= 1 && this.noteId) {
      await this.yjsPersistChain
      await this.persistYjsState()
      await this.persistSql(this.noteId)
    }
  }

  private queueYjsPersist() {
    this.yjsPersistChain = this.yjsPersistChain
      .then(async () => {
        if (!this.doc) {
          return
        }

        // Encode at write time so coalesced updates persist the latest doc.
        const state = Y.encodeStateAsUpdate(this.doc)
        await this.ctx.storage.put('yjs-state', state)
      })
      .catch(() => {
        // Keep the chain alive after a failed write so later persists still run.
      })
  }

  private scheduleSqlPersist(noteId: string) {
    void this.ctx.storage.put('pending-sql-note-id', noteId)
    void this.ctx.storage.setAlarm(Date.now() + SQL_PERSIST_DEBOUNCE_MS)
  }

  private async persistYjsState() {
    if (!this.doc) {
      return
    }

    const state = Y.encodeStateAsUpdate(this.doc)
    await this.ctx.storage.put('yjs-state', state)
  }

  private async persistSql(noteId: string) {
    if (!this.doc) {
      return
    }

    const contentType =
      this.contentType ||
      ((await this.ctx.storage.get<string>('content-type')) === 'markdown' ? 'markdown' : 'html')

    if (contentType === 'markdown') {
      const { content, preview } = extractMarkdownNoteContent(this.doc)
      await updateProjectNoteContent(this.env.VMS_DB, noteId, content, preview)
      return
    }

    const { html, preview } = extractNoteContent(this.doc)
    await updateProjectNoteContent(this.env.VMS_DB, noteId, html, preview)
  }
}

export type ProjectNoteRoomStub = DurableObjectStub<ProjectNoteRoom>
