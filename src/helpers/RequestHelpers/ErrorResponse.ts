import { Response, Errback } from 'express'
import { EHttpStatusCode } from '../../enums/EHttpError'
import { IResponseHandler } from '../../interfaces/IResponseHandler'
import { BaseError } from '../BaseError'

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
      case((error as Error).name === 'ValidationError'):
        this.statusCode = EHttpStatusCode.BadRequest
        this.message = (error as Error).message
        break;
      case((error as Error).name === 'Unauthorized'):
        this.statusCode = EHttpStatusCode.Unauthorized
        this.message = (error as Error).message
        break;
      default:
        this.statusCode = (error as BaseError).status
        this.message = (error as Error).message
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