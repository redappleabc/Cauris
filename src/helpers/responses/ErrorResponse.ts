import { Response } from 'express'
import { EHttpStatusCode } from '@servichain/enums'
import { IResponseHandler } from '@servichain/interfaces'
import { BaseError } from '@servichain/helpers/BaseError'

export class ErrorResponse implements IResponseHandler {
  statusCode: EHttpStatusCode
  message: String

  constructor(error: Error) {
    if (error instanceof BaseError) {
      this.statusCode = error.status
      this.message = error.message
    } else
      this.formatMessage(error)
  }

  private formatMessage(error: Error) {
    switch(true) {
      case(error.name === 'ValidationError'):
        this.statusCode = EHttpStatusCode.BadRequest
        this.message = error.message
        break;
      case(error.name === 'Unauthorized'):
        this.statusCode = EHttpStatusCode.Unauthorized
        this.message = error.message
        break;
      case(error.name === 'MongooseError'):
        this.statusCode = EHttpStatusCode.BadRequest
        this.message = error.message
      default:
        this.statusCode = (error as BaseError).status
        this.message = error.message
        break;
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