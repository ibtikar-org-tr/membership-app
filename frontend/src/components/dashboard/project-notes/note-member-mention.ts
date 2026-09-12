import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import type { Instance as TippyInstance } from 'tippy.js'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { MemberMentionList, type MemberMentionListHandle } from './MemberMentionList'
import { filterMentionableMembers, type MentionableMember } from './mentionable-members'

function mentionClientRect(getRect: (() => DOMRect | null) | null | undefined) {
  return () => getRect?.() ?? new DOMRect(0, 0, 0, 0)
}

function destroyMentionPopup(popup: TippyInstance | null, component: ReactRenderer<MemberMentionListHandle> | null) {
  try {
    popup?.destroy()
  } catch {
    // Tippy may already be torn down when the editor remounts.
  }

  try {
    component?.destroy()
  } catch {
    // ReactRenderer can throw if the editor view is already gone.
  }
}

export function createNoteMemberMention(getMembers: () => MentionableMember[]) {
  return Mention.configure({
    HTMLAttributes: {
      class: 'note-mention',
      'data-type': 'mention',
    },
    renderText({ node }) {
      const label = node.attrs.label ?? node.attrs.id ?? ''
      return `@${label}`
    },
    renderHTML({ node }) {
      const id = node.attrs.id ?? ''
      const label = node.attrs.label ?? id

      return [
        'span',
        {
          'data-type': 'mention',
          'data-id': id,
          'data-label': label,
          class: 'note-mention',
        },
        `@${label}`,
      ]
    },
    suggestion: {
      char: '@',
      allowSpaces: true,
      items: ({ query }) => filterMentionableMembers(getMembers(), query),
      render: () => {
        let component: ReactRenderer<MemberMentionListHandle> | null = null
        let popup: TippyInstance | null = null

        const cleanup = () => {
          destroyMentionPopup(popup, component)
          popup = null
          component = null
        }

        return {
          onStart: (props) => {
            cleanup()

            component = new ReactRenderer(MemberMentionList, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) {
              return
            }

            popup = tippy(document.body, {
              getReferenceClientRect: mentionClientRect(props.clientRect),
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              offset: [0, 6],
              zIndex: 60,
              maxWidth: 'none',
              onHidden(instance) {
                // Ensure interactive layers never linger after hide/escape.
                if (instance.state.isDestroyed) {
                  return
                }
              },
            })
          },
          onUpdate(props) {
            component?.updateProps(props)

            if (!props.clientRect || !popup) {
              return
            }

            popup.setProps({
              getReferenceClientRect: mentionClientRect(props.clientRect),
            })
          },
          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              cleanup()
              return true
            }

            return component?.ref?.onKeyDown(props) ?? false
          },
          onExit() {
            cleanup()
          },
        }
      },
    },
  })
}
