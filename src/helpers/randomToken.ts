import crypto from 'crypto'

export default function generateRandomToken() {
  return crypto.randomBytes(40).toString('hex')
}