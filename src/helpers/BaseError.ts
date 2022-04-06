import { EHttpStatusCode } from "@servichain/enums"

export class BaseError extends Error {
  statusCode: EHttpStatusCode
  critical: boolean

  constructor(statusCode: EHttpStatusCode, message: string, critical: boolean = false) {
    super(message)
    this.name = "ServichainException"
    this.statusCode = statusCode
    this.critical = critical
    Error.captureStackTrace(this)
  }
}