import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'

export type TextDirection = 'ltr' | 'rtl' | 'auto'

const BLOCK_TYPES = ['paragraph', 'heading', 'blockquote', 'listItem'] as const
const BLOCK_TYPE_SET = new Set<string>(BLOCK_TYPES)

const STRONG_RTL_RE =
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const STRONG_LTR_RE = /[A-Za-z]/

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteTextDirection: {
      setTextDirection: (direction: TextDirection) => ReturnType
    }
  }
}

export function detectDirectionFromText(text: string): 'ltr' | 'rtl' {
  for (const char of text) {
    if (STRONG_RTL_RE.test(char)) {
      return 'rtl'
    }

    if (STRONG_LTR_RE.test(char)) {
      return 'ltr'
    }
  }

  return 'rtl'
}

function resolveBlockDirection(
  textDirection: string | null | undefined,
  text: string,
): 'ltr' | 'rtl' {
  if (textDirection === 'ltr' || textDirection === 'rtl') {
    return textDirection
  }

  return detectDirectionFromText(text)
}

function parseTextDirection(element: HTMLElement): TextDirection {
  const explicit = element.getAttribute('data-text-direction')
  if (explicit === 'ltr' || explicit === 'rtl' || explicit === 'auto') {
    return explicit
  }

  const dir = element.getAttribute('dir')
  if (dir === 'ltr' || dir === 'rtl') {
    return dir
  }

  return 'auto'
}

function activeBlockType(editor: { isActive: (name: string, attrs?: Record<string, unknown>) => boolean }) {
  for (const type of BLOCK_TYPES) {
    if (editor.isActive(type)) {
      return type
    }
  }

  return 'paragraph'
}

function normalizeTextDirection(value: unknown): TextDirection {
  if (value === 'ltr' || value === 'rtl' || value === 'auto') {
    return value
  }

  return 'auto'
}

function updateBlockDirection(tr: Transaction, pos: number, node: ProseMirrorNode) {
  const textDirection = normalizeTextDirection(node.attrs.textDirection)
  const resolved = resolveBlockDirection(textDirection, node.textContent)

  if (node.attrs.textDirection === textDirection && node.attrs.dir === resolved) {
    return false
  }

  tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    textDirection,
    dir: resolved,
  })
  return true
}

function collectChangedRanges(transactions: readonly Transaction[]) {
  let from = Number.POSITIVE_INFINITY
  let to = 0

  for (const transaction of transactions) {
    if (!transaction.docChanged) {
      continue
    }

    transaction.mapping.maps.forEach((stepMap) => {
      stepMap.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
        from = Math.min(from, newStart)
        to = Math.max(to, newEnd)
      })
    })
  }

  if (!Number.isFinite(from)) {
    return null
  }

  return { from, to: Math.max(to, from + 1) }
}

function applyAutoBlockDirectionsInRange(tr: Transaction, from: number, to: number) {
  let changed = false
  const size = tr.doc.content.size
  const start = Math.max(0, from)
  const end = Math.min(size, Math.max(to, start + 1))

  tr.doc.nodesBetween(start, end, (node, pos) => {
    if (!BLOCK_TYPE_SET.has(node.type.name)) {
      return
    }

    if (updateBlockDirection(tr, pos, node)) {
      changed = true
    }
  })

  return changed
}

function applyAutoBlockDirectionsEverywhere(tr: Transaction) {
  let changed = false

  tr.doc.descendants((node, pos) => {
    if (!BLOCK_TYPE_SET.has(node.type.name)) {
      return
    }

    if (updateBlockDirection(tr, pos, node)) {
      changed = true
    }
  })

  return changed
}

export function getActiveTextDirection(editor: {
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean
  getAttributes: (name: string) => Record<string, unknown>
}): TextDirection {
  const type = activeBlockType(editor)
  return normalizeTextDirection(editor.getAttributes(type).textDirection)
}

export const NoteTextDirection = Extension.create({
  name: 'noteTextDirection',

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_TYPES],
        attributes: {
          textDirection: {
            default: 'auto',
            parseHTML: (element) => parseTextDirection(element),
            renderHTML: (attributes) => ({
              'data-text-direction':
                attributes.textDirection === 'ltr' || attributes.textDirection === 'rtl'
                  ? attributes.textDirection
                  : 'auto',
            }),
          },
          dir: {
            default: 'rtl',
            parseHTML: (element) => {
              const dir = element.getAttribute('dir')
              if (dir === 'ltr' || dir === 'rtl') {
                return dir
              }

              return detectDirectionFromText(element.textContent ?? '')
            },
            renderHTML: (attributes) => {
              const dir =
                attributes.dir === 'ltr' || attributes.dir === 'rtl'
                  ? attributes.dir
                  : resolveBlockDirection(attributes.textDirection, '')

              return { dir }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setTextDirection:
        (direction: TextDirection) =>
        ({ editor, chain }) => {
          const type = activeBlockType(editor)
          const text = editor.state.selection.$from.parent.textContent
          const resolved = resolveBlockDirection(direction, text)

          return chain()
            .focus()
            .updateAttributes(type, {
              textDirection: direction,
              dir: resolved,
            })
            .run()
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null
          }

          const ranges = collectChangedRanges(transactions)
          if (!ranges) {
            return null
          }

          const tr = newState.tr
          // Pad slightly so parent list items / adjacent blocks still update.
          const changed = applyAutoBlockDirectionsInRange(tr, ranges.from - 2, ranges.to + 2)
          return changed ? tr : null
        },
      }),
    ]
  },

  onCreate() {
    const tr = this.editor.state.tr
    const changed = applyAutoBlockDirectionsEverywhere(tr)

    if (changed) {
      tr.setMeta('addToHistory', false)
      this.editor.view.dispatch(tr)
    }
  },
})
