export type Role = 'user' | 'admin'

export const USERS: Record<string, { password: string; role: Role }> = {
  vendor: { password: 'password123', role: 'user' },
  admin: { password: 'admin123', role: 'admin' },
}

export const SESSION_COOKIE = 'dibbs_session'
