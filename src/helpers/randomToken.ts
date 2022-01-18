import crypto from 'crypto'

export function generateRandomToken() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}