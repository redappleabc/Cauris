import { EHttpStatusCode } from '@servichain/enums'
import { EError } from '@servichain/enums/EError'
import crypto from 'crypto'
import { BaseError } from './BaseError'

export function generateRandomToken(bytes: number) {
  try {
    return crypto.randomBytes(bytes).toString('hex').toUpperCase()
  } catch (e) {
    throw new BaseError(EHttpStatusCode.InternalServerError, EError.LibraryCrash, e, true)
  }
}