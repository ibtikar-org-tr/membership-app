import type { AppBindings } from './bindings'
import type { AuthUser } from './auth'

export type AppVariables = {
  authUser: AuthUser
}

export type AppEnv = {
  Bindings: AppBindings
  Variables: AppVariables
}
