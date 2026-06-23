const MIRROR_PROPERTIES = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
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

export function getTextareaCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): TextareaCaretCoordinates {
  const clampedPosition = Math.max(0, Math.min(position, textarea.value.length))
  const mirror = document.createElement('div')
  const marker = document.createElement('span')
  const computed = window.getComputedStyle(textarea)

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.overflow = 'hidden'

  for (const property of MIRROR_PROPERTIES) {
    mirror.style[property] = computed[property]
  }

  mirror.textContent = textarea.value.slice(0, clampedPosition)
  marker.textContent = textarea.value.slice(clampedPosition) || '.'

  mirror.appendChild(marker)
  document.body.appendChild(mirror)

  const lineHeight = Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.75 || 20

  const coordinates: TextareaCaretCoordinates = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft - textarea.scrollLeft,
    height: lineHeight,
  }

  document.body.removeChild(mirror)
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

  const mirror = document.createElement('div')
  const computed = window.getComputedStyle(textarea)

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.overflow = 'hidden'

  for (const property of MIRROR_PROPERTIES) {
    mirror.style[property] = computed[property]
  }

  const before = document.createTextNode(textarea.value.slice(0, start))
  const selected = document.createElement('span')
  selected.textContent = textarea.value.slice(start, end)
  const after = document.createTextNode(textarea.value.slice(end))

  mirror.appendChild(before)
  mirror.appendChild(selected)
  mirror.appendChild(after)
  document.body.appendChild(mirror)

  const rect = {
    top: selected.offsetTop - textarea.scrollTop,
    left: selected.offsetLeft - textarea.scrollLeft,
    width: selected.offsetWidth,
    height: selected.offsetHeight || startCoords.height,
  }

  document.body.removeChild(mirror)
  return rect
}
