import { html as beautifyHtml } from 'js-beautify'

/** Pretty-print note HTML with js-beautify for the code view. */
export function beautifyNoteHtml(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  return beautifyHtml(trimmed, {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 1,
    preserve_newlines: true,
    end_with_newline: false,
    wrap_line_length: 0,
    indent_inner_html: true,
    extra_liners: [],
    content_unformatted: ['pre', 'code', 'textarea'],
    inline: [],
  }).trim()
}

/** Light formatting used when opening the HTML pane. */
export function formatNoteHtmlForEditing(html: string) {
  return beautifyNoteHtml(html)
}

export function normalizeNoteHtmlInput(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  return trimmed
}
