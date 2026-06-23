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

function createTextareaMirror(textarea: HTMLTextAreaElement) {
  const mirror = document.createElement('div')
  const computed = window.getComputedStyle(textarea)

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.overflow = 'hidden'
  mirror.style.top = '0'
  mirror.style.left = '0'
  mirror.style.height = 'auto'
  mirror.style.padding = '0'
  mirror.style.border = '0'
  mirror.style.margin = '0'
  mirror.style.width = `${textarea.clientWidth}px`

  for (const property of MIRROR_PROPERTIES) {
    mirror.style[property] = computed[property]
  }

  document.body.appendChild(mirror)
  return { mirror, computed }
}

function removeMirror(mirror: HTMLDivElement) {
  document.body.removeChild(mirror)
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

export function getTextareaCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): TextareaCaretCoordinates {
  const clampedPosition = Math.max(0, Math.min(position, textarea.value.length))
  const { mirror, computed } = createTextareaMirror(textarea)
  const marker = document.createElement('span')

  mirror.append(document.createTextNode(textarea.value.slice(0, clampedPosition)))
  marker.textContent = textarea.value.slice(clampedPosition) || '\u200b'
  mirror.appendChild(marker)

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

  mirror.append(document.createTextNode(textarea.value.slice(0, start)))
  selected.textContent = textarea.value.slice(start, end)
  mirror.appendChild(selected)
  mirror.append(document.createTextNode(textarea.value.slice(end)))

  const rect = {
    top: selected.offsetTop - textarea.scrollTop,
    left: selected.offsetLeft - textarea.scrollLeft,
    width: Math.max(selected.offsetWidth, 2),
    height: selected.offsetHeight || lineHeightFromComputed(computed),
  }

  removeMirror(mirror)
  return rect
}
