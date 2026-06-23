import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
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

function applyAutoBlockDirections(tr: Transaction) {
  let changed = false

  tr.doc.descendants((node, pos) => {
    if (!BLOCK_TYPE_SET.has(node.type.name)) {
      return
    }

    const textDirection = normalizeTextDirection(node.attrs.textDirection)
    const resolved = resolveBlockDirection(textDirection, node.textContent)

    if (node.attrs.textDirection === textDirection && node.attrs.dir === resolved) {
      return
    }

    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      textDirection,
      dir: resolved,
    })
    changed = true
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

          const tr = newState.tr
          const changed = applyAutoBlockDirections(tr)

          return changed ? tr : null
        },
      }),
    ]
  },

  onCreate() {
    const tr = this.editor.state.tr
    const changed = applyAutoBlockDirections(tr)

    if (changed) {
      tr.setMeta('addToHistory', false)
      this.editor.view.dispatch(tr)
    }
  },
})
