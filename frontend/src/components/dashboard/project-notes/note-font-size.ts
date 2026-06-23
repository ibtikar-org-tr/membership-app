import TextStyle from '@tiptap/extension-text-style'

export const NoteFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {}
          }

          return {
            style: `font-size: ${attributes.fontSize}`,
          }
        },
      },
    }
  },
})
