export interface D1PreparedStatementResultLike {
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<unknown>
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementResultLike
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
}

export interface R2BucketLike {
  put(key: string, value: ArrayBuffer | ReadableStream<Uint8Array> | string): Promise<R2Object>
  get(key: string): Promise<R2ObjectBody | null>
  delete(key: string): Promise<void>
}

export interface R2Object {
  key: string
  version: string
  size: number
  etag: string
  httpEtag: string
  checksums: Record<string, string>
  uploaded: Date
  httpMetadata: R2HttpMetadata
  customMetadata: Record<string, string>
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream<Uint8Array>
  bodyUsed: boolean
}

export interface R2HttpMetadata {
  contentType?: string
  contentLanguage?: string
  contentDisposition?: string
  contentEncoding?: string
  cacheControl?: string
  expires?: Date
}

export interface AppBindings {
  MEMBERS_DB: D1DatabaseLike
  VMS_DB: D1DatabaseLike
  MY_BUCKET: R2BucketLike
  MEMBERSHIP_NUMBER_PREFIX: string
  SMTP_HOST: string
  SMTP_PORT: string | number
  SMTP_USER: string
  SMTP_PASS: string
  TELEGRAM_MS: string
  INTERNAL_SECRET: string
}
