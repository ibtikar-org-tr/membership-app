const MIRROR_PROPERTIES = [
  'direction',
  'boxSizing',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
] as const

export interface TextareaCaretCoordinates {
  top: number
  left: number
  height: number
}

function lineHeightFromComputed(computed: CSSStyleDeclaration) {
  const parsedLineHeight = Number.parseFloat(computed.lineHeight)
  if (Number.isFinite(parsedLineHeight) && parsedLineHeight > 0) {
    return parsedLineHeight
  }

  const parsedFontSize = Number.parseFloat(computed.fontSize)
  if (Number.isFinite(parsedFontSize) && parsedFontSize > 0) {
    return parsedFontSize * 1.75
  }

  return 20
}

function createTextareaMirror(textarea: HTMLTextAreaElement) {
  const mirror = document.createElement('div')
  const computed = window.getComputedStyle(textarea)

  mirror.setAttribute('dir', textarea.dir || computed.direction || 'auto')
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.wordBreak = 'break-word'
  mirror.style.overflow = 'hidden'
  mirror.style.top = '0'
  mirror.style.left = '0'
  mirror.style.height = 'auto'
  mirror.style.padding = '0'
  mirror.style.border = '0'
  mirror.style.margin = '0'
  mirror.style.width = `${textarea.clientWidth}px`
  mirror.style.boxSizing = 'content-box'

  for (const property of MIRROR_PROPERTIES) {
    if (property === 'boxSizing') {
      continue
    }

    mirror.style[property] = computed[property]
  }

  document.body.appendChild(mirror)
  return { mirror, computed }
}

function removeMirror(mirror: HTMLDivElement) {
  mirror.remove()
}

export function getTextareaCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): TextareaCaretCoordinates {
  const clampedPosition = Math.max(0, Math.min(position, textarea.value.length))
  const { mirror, computed } = createTextareaMirror(textarea)
  const marker = document.createElement('span')

  marker.textContent = '\u200b'
  mirror.textContent = textarea.value.substring(0, clampedPosition)
  mirror.appendChild(marker)
  if (clampedPosition < textarea.value.length) {
    mirror.append(document.createTextNode(textarea.value.substring(clampedPosition)))
  }

  const coordinates: TextareaCaretCoordinates = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft - textarea.scrollLeft,
    height: lineHeightFromComputed(computed),
  }

  removeMirror(mirror)
  return coordinates
}

export function getTextareaSelectionRect(
  textarea: HTMLTextAreaElement,
  anchor: number,
  head: number,
): { top: number; left: number; width: number; height: number } | null {
  const start = Math.min(anchor, head)
  const end = Math.max(anchor, head)

  if (start === end) {
    return null
  }

  const startCoords = getTextareaCaretCoordinates(textarea, start)
  const endCoords = getTextareaCaretCoordinates(textarea, end)

  if (startCoords.top === endCoords.top) {
    return {
      top: startCoords.top,
      left: startCoords.left,
      width: Math.max(endCoords.left - startCoords.left, 2),
      height: startCoords.height,
    }
  }

  const { mirror, computed } = createTextareaMirror(textarea)
  const selected = document.createElement('span')

  selected.textContent = textarea.value.substring(start, end)
  mirror.textContent = textarea.value.substring(0, start)
  mirror.appendChild(selected)
  if (end < textarea.value.length) {
    mirror.append(document.createTextNode(textarea.value.substring(end)))
  }

  const rect = {
    top: selected.offsetTop - textarea.scrollTop,
    left: selected.offsetLeft - textarea.scrollLeft,
    width: Math.max(selected.offsetWidth, 2),
    height: selected.offsetHeight || lineHeightFromComputed(computed),
  }

  removeMirror(mirror)
  return rect
}
