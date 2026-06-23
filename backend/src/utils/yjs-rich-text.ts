import * as Y from 'yjs'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function xmlTextToHtml(text: Y.XmlText) {
  return text
    .toDelta()
    .map((operation) => {
      if (typeof operation.insert !== 'string') {
        return ''
      }

      let chunk = escapeHtml(operation.insert)
      const attributes = operation.attributes ?? {}

      if (attributes.bold) {
        chunk = `<strong>${chunk}</strong>`
      }

      if (attributes.italic) {
        chunk = `<em>${chunk}</em>`
      }

      if (attributes.underline) {
        chunk = `<u>${chunk}</u>`
      }

      if (attributes.textStyle && typeof attributes.textStyle === 'object') {
        const fontSize = (attributes.textStyle as { fontSize?: string }).fontSize
        if (fontSize) {
          chunk = `<span style="font-size:${escapeHtml(fontSize)}">${chunk}</span>`
        }
      }

      return chunk
    })
    .join('')
}

function xmlNodeToHtml(node: Y.XmlText | Y.XmlElement): string {
  if (node instanceof Y.XmlText) {
    return xmlTextToHtml(node)
  }

  const inner = node
    .toArray()
    .map((child) => xmlNodeToHtml(child as Y.XmlText | Y.XmlElement))
    .join('')

  switch (node.nodeName) {
    case 'paragraph':
      return `<p>${inner || '<br>'}</p>`
    case 'heading': {
      const level = node.getAttribute('level') ?? 1
      return `<h${level}>${inner}</h${level}>`
    }
    case 'bulletList':
      return `<ul>${inner}</ul>`
    case 'orderedList':
      return `<ol>${inner}</ol>`
    case 'listItem':
      return `<li>${inner}</li>`
    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`
    case 'codeBlock':
      return `<pre><code>${inner}</code></pre>`
    case 'hardBreak':
      return '<br>'
    default:
      return inner
  }
}

export function xmlFragmentToHtml(fragment: Y.XmlFragment) {
  if (fragment.length === 0) {
    return ''
  }

  return fragment
    .toArray()
    .map((node) => xmlNodeToHtml(node as Y.XmlText | Y.XmlElement))
    .join('')
}

export function xmlFragmentToPlainText(fragment: Y.XmlFragment) {
  const parts: string[] = []

  fragment.forEach((node) => {
    if (node instanceof Y.XmlText) {
      parts.push(node.toString())
      return
    }

    if (node instanceof Y.XmlElement) {
      parts.push(xmlFragmentToPlainText(node as unknown as Y.XmlFragment))
      if (['paragraph', 'heading', 'listItem', 'blockquote'].includes(node.nodeName)) {
        parts.push('\n')
      }
    }
  })

  return parts.join('').replace(/\n+/g, '\n').trim()
}

export function extractNoteContent(doc: Y.Doc) {
  const fragment = doc.getXmlFragment('default')
  if (fragment.length > 0) {
    const html = xmlFragmentToHtml(fragment)
    return {
      html,
      preview: createContentPreview(xmlFragmentToPlainText(fragment)),
    }
  }

  const legacyText = doc.getText('content').toString()
  return {
    html: legacyText,
    preview: createContentPreview(legacyText),
  }
}

function createContentPreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return null
  }

  return normalized.length > 200 ? `${normalized.slice(0, 197)}...` : normalized
}
