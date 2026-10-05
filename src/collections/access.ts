import type { Access } from 'payload'

type UserRole = 'super-admin' | 'editor' | 'staff'

const roleOf = (user: unknown): UserRole | undefined => {
  if (!user || typeof user !== 'object' || !('role' in user)) return undefined
  return (user as { role?: UserRole }).role
}

export const isSuperAdmin: Access = ({ req }) => roleOf(req.user) === 'super-admin'

export const canManageContent: Access = ({ req }) => {
  const role = roleOf(req.user)
  return role === 'super-admin' || role === 'editor'
}

export const canManageSubmissions: Access = ({ req }) => {
  const role = roleOf(req.user)
  return role === 'super-admin' || role === 'staff' || role === 'editor'
}

export const publishedOrAuthenticated: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }