/** Light formatting so raw note HTML is easier to scan in the code view. */
export function formatNoteHtmlForEditing(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  return trimmed
    .replace(/>\s+</g, '><')
    .replace(/<\/(p|h[1-6]|li|blockquote|pre|ul|ol)>/gi, '</$1>\n')
    .replace(/<(ul|ol|blockquote|pre)>/gi, '<$1>\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function normalizeNoteHtmlInput(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  return trimmed
}
