import { marked } from 'marked'
import TurndownService from 'turndown'
import type * as Y from 'yjs'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

marked.setOptions({
  gfm: true,
  breaks: false,
})

export function markdownToHtml(markdown: string) {
  const trimmed = markdown.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  const html = marked.parse(trimmed, { async: false })
  return typeof html === 'string' && html.trim() ? html : '<p></p>'
}

export function htmlToMarkdown(html: string) {
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>') {
    return ''
  }

  return turndown.turndown(trimmed).trim()
}

/** Light normalize used when opening / beautifying the Markdown pane. */
export function beautifyNoteMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function formatNoteMarkdownForEditing(markdown: string) {
  return beautifyNoteMarkdown(markdown)
}

export function normalizeNoteMarkdownInput(markdown: string) {
  return markdown.replace(/\r\n/g, '\n')
}

export function replaceYTextContent(yText: Y.Text, next: string) {
  const current = yText.toString()
  if (current === next) {
    return false
  }

  const length = yText.length
  if (length > 0) {
    yText.delete(0, length)
  }

  if (next) {
    yText.insert(0, next)
  }

  return true
}
