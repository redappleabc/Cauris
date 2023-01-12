import { EHttpStatusCode } from "@servichain/enums"
import logger from "@servichain/utils/logger"
export class BaseError extends Error {
  statusCode: EHttpStatusCode
  critical: boolean

  constructor(statusCode: EHttpStatusCode, message: string, e:Error=null, critical: boolean = false) {
    if (e instanceof BaseError) {
      super(e.message)
      this.name = e.name
      this.statusCode = e.statusCode
      this.critical = e.critical
    } else {
      super(message)
      this.name = "ServichainException"
      this.statusCode = statusCode
      this.critical = critical
      Error.captureStackTrace(this)
      logger.error({statusCode: statusCode, message: message, e})
    }
  }
}