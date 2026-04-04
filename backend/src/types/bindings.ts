export interface D1PreparedStatementResultLike {
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<unknown>
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementResultLike
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
}

export interface AppBindings {
  MY_DB: D1DatabaseLike
  MEMBERSHIP_NUMBER_PREFIX: string
}
