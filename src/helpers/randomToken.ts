import crypto from 'crypto'

export function generateRandomToken(bytes: number) {
  return crypto.randomBytes(bytes).toString('hex').toUpperCase()
}