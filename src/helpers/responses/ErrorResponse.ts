import { Response } from 'express'
import { EHttpStatusCode } from '@servichain/enums'
import { IResponseHandler } from '@servichain/interfaces'
import { BaseError } from '@servichain/helpers/BaseError'

export class ErrorResponse implements IResponseHandler {
  statusCode: EHttpStatusCode
  message: String

  constructor(error: Error) {
    if (error instanceof BaseError) {
      this.statusCode = error.statusCode
      this.message = error.message
    } else {
      [this.statusCode, this.message] = this.processError(error)

    }
  }

  private processError(error: any) : [EHttpStatusCode, string, any?] {
    switch (error.name) {
      case 'ValidationError':
        return [EHttpStatusCode.BadRequest, "JoiValidationError : " + error.path]
      case 'MongoServerError':
        if (error.code == 11000)
          return [EHttpStatusCode.BadRequest, "DuplicateKey", ]
        else if (error.code == 11600)
          return [EHttpStatusCode.InternalServerError, "NoMongo"]
      case 'Unauthorized':
        return [EHttpStatusCode.Unauthorized, error.message]
      default:
        return [EHttpStatusCode.InternalServerError, error.message]
    }
  }

  public getBody() {
    return this.message
  }

  public async handleResponse(res: Response): Promise<void> {
    res.status(this.statusCode).send({
      status: 'error',
      statusCode: this.statusCode,
      body: this.message
    })
  }
}