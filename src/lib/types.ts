import type { authClient } from "./auth-client"

export type ServerSession = typeof authClient.$Infer.Session | null
