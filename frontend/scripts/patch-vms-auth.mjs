import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const p = path.join(__dirname, '../src/api/vms.ts')
let c = fs.readFileSync(p, 'utf8')

c = c.replace(
  "const MEMBER_MS_BASE_URL = (import.meta.env.VITE_MEMBER_MS as string | undefined)?.trim()\nconst API_BASE = MEMBER_MS_BASE_URL ? `${MEMBER_MS_BASE_URL.replace(/\\/+$/, '')}/api` : '/ms/membership-app/api'\n",
  "import { API_BASE, apiDelete, apiFetch, apiGetJson, apiPostJson, apiPutJson, logoutRequest } from './client'\n",
)
c = c.replace('  VmsProjectMember,\n  VmsSkill,', '  VmsProjectMember,\n  VmsProjectMemberContact,\n  VmsSkill,')

c = c.replace(
  /async function fetchJson<T>\(path: string\): Promise<T> \{[\s\S]*?inFlightGetRequests\.delete\(requestKey\)\n  \}\n\}/,
  `async function fetchJson<T>(path: string): Promise<T> {
  const requestKey = path
  const now = Date.now()
  const cached = recentGetResponses.get(requestKey)
  if (cached && cached.expiresAt > now) return cached.data as T
  const inFlight = inFlightGetRequests.get(requestKey)
  if (inFlight) return inFlight as Promise<T>
  const requestPromise = (async () => {
    const payload = await apiGetJson<T>(path)
    recentGetResponses.set(requestKey, { data: payload, expiresAt: Date.now() + GET_CACHE_TTL_MS })
    return payload
  })()
  inFlightGetRequests.set(requestKey, requestPromise)
  try { return await requestPromise } finally { inFlightGetRequests.delete(requestKey) }
}`,
)

c = c.replace(
  /async function postJson[\s\S]*?return \(await response\.json\(\)\) as TResponse\n\}/,
  `async function postJson<TResponse, TPayload>(path: string, payload: TPayload, options?: { auth?: boolean }): Promise<TResponse> {
  return apiPostJson<TResponse, TPayload>(path, payload, options)
}`,
)

c = c.replace(
  /async function putJson[\s\S]*?return \(await response\.json\(\)\) as TResponse\n\}/,
  `async function putJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  return apiPutJson<TResponse, TPayload>(path, payload)
}`,
)

c = c.replace(
  /async function deleteJson[\s\S]*?\n\}\n\nexport function login/,
  `async function deleteJson(path: string): Promise<void> {
  return apiDelete(path)
}

export function login`,
)

c = c.replace(
  "export function login(payload: { identifier: string; password: string }) {\n  return postJson<LoginResponse, { identifier: string; password: string }>('/login', payload)\n}",
  "export function login(payload: { identifier: string; password: string }) {\n  return postJson<LoginResponse, { identifier: string; password: string }>('/login', payload, { auth: false })\n}\n\nexport function logout() {\n  return logoutRequest()\n}",
)

c = c.replace("('/forgot-password',\n    payload,\n  )", "('/forgot-password',\n    payload,\n    { auth: false },\n  )")
c = c.replace("('/reset-password', payload)", "('/reset-password', payload, { auth: false })")

c = c.replace(/\?membershipNumber=\$\{encodeURIComponent\([^)]+\)\}/g, '')
c = c.replace(/&membershipNumber=\$\{encodeURIComponent\([^)]+\)\}/g, '')
c = c.replace(/\?approver=\$\{encodeURIComponent\([^)]+\)\}&/g, '?')
c = c.replace(
  '`?projectId=${encodeURIComponent(projectId)}&membershipNumber=${encodeURIComponent(membershipNumber)}`',
  '`?projectId=${encodeURIComponent(projectId)}`',
)

if (!c.includes('fetchProjectMemberContact')) {
  c = c.replace(
    'export function fetchProjectMembers(projectId?: string) {',
    `export function fetchProjectMemberContact(projectId: string, targetMembershipNumber: string) {
  return fetchJson<{ contact: VmsProjectMemberContact }>(
    \`/project-members/\${encodeURIComponent(projectId)}/\${encodeURIComponent(targetMembershipNumber)}/contact\`,
  )
}

export function fetchProjectMembers(projectId?: string) {`,
  )
}

c = c.replace(
  "  const response = await fetch(`${API_BASE}/images/upload`, {\n    method: 'POST',\n    body: formData,\n  })",
  "  const response = await apiFetch('/images/upload', { method: 'POST', body: formData })",
)

fs.writeFileSync(p, c)
console.log('patched', p)
