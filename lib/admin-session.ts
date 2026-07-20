import { createHash } from 'crypto'

export function adminSessionToken(): string {
  return createHash('sha256').update(`${process.env.ADMIN_PASSWORD}:strength-king-admin`).digest('hex')
}
