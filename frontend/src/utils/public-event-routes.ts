import { matchPath } from 'react-router-dom'

const PUBLIC_EVENT_DETAIL_PATTERNS = [
  '/event/:eventID',
  '/dashboard/event/:eventID',
  '/dashboard/events/:eventID',
] as const

export function isPublicEventDetailPath(pathname: string): boolean {
  return PUBLIC_EVENT_DETAIL_PATTERNS.some((pattern) => Boolean(matchPath({ path: pattern, end: true }, pathname)))
}

export function isStandalonePublicEventPath(pathname: string): boolean {
  return Boolean(matchPath({ path: '/event/:eventID', end: true }, pathname))
}
