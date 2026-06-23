import { Extension } from '@tiptap/core'

export type TextDirection = 'ltr' | 'rtl' | 'auto'

const BLOCK_TYPES = ['paragraph', 'heading', 'blockquote', 'listItem'] as const

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteTextDirection: {
      setTextDirection: (direction: TextDirection) => ReturnType
    }
  }
}

function activeBlockType(editor: { isActive: (name: string, attrs?: Record<string, unknown>) => boolean }) {
  for (const type of BLOCK_TYPES) {
    if (editor.isActive(type)) {
      return type
    }
  }

  return 'paragraph'
}

export function getActiveTextDirection(editor: {
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean
  getAttributes: (name: string) => Record<string, unknown>
}): TextDirection {
  const type = activeBlockType(editor)
  const dir = editor.getAttributes(type).dir

  if (dir === 'ltr' || dir === 'rtl') {
    return dir
  }

  return 'auto'
}

export const NoteTextDirection = Extension.create({
  name: 'noteTextDirection',

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_TYPES],
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => element.getAttribute('dir'),
            renderHTML: (attributes) => {
              if (attributes.dir !== 'ltr' && attributes.dir !== 'rtl') {
                return {}
              }

              return { dir: attributes.dir }
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
          const nextDir = direction === 'auto' ? null : direction
          return chain().focus().updateAttributes(type, { dir: nextDir }).run()
        },
    }
  },
})
