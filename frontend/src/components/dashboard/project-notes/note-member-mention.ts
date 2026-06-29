import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import type { Instance as TippyInstance } from 'tippy.js'
import tippy from 'tippy.js'
import { MemberMentionList, type MemberMentionListHandle } from './MemberMentionList'
import { filterMentionableMembers, type MentionableMember } from './mentionable-members'

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

        return {
          onStart: (props) => {
            component = new ReactRenderer(MemberMentionList, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) {
              return
            }

            popup = tippy(document.body, {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            })
          },
          onUpdate(props) {
            component?.updateProps(props)

            if (!props.clientRect) {
              return
            }

            popup?.setProps({
              getReferenceClientRect: props.clientRect,
            })
          },
          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              popup?.hide()
              return true
            }

            return component?.ref?.onKeyDown(props) ?? false
          },
          onExit() {
            popup?.destroy()
            component?.destroy()
            popup = null
            component = null
          },
        }
      },
    },
  })
}
