import { Response } from 'express'
import { EHttpStatusCode } from '../../enums/EHttpError'
import { IResponseHandler } from '../../interfaces/IResponseHandler'

export class ErrorResponse implements IResponseHandler {
  statusCode: EHttpStatusCode
  message: String

  constructor(code: EHttpStatusCode, error: Error | String) {
    console.log(error)
    this.formatMessage(code, error)
  }

  private formatMessage(statusCode: EHttpStatusCode, error: String | Error) {
    switch(true) {
      case(typeof error === 'string'):
        this.statusCode = statusCode
        this.message = error as String
        break;
      case((error as Error).name === 'ValidationError'):
        this.statusCode = EHttpStatusCode.BadRequest
        this.message = (error as Error).message
        break;
      case((error as Error).name === 'Unauthorized'):
        this.statusCode = EHttpStatusCode.Unauthorized
        this.message = (error as Error).message
        break;
      default:
        this.statusCode = EHttpStatusCode.InternalServerError
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