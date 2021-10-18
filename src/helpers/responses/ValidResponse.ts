import { Response } from 'express'
import { IResponseHandler } from '@servichain/interfaces/IResponseHandler'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'

export class ValidResponse implements IResponseHandler {
  statusCode: EHttpStatusCode
  message: any
  constructor(code: number, public data: any) {
    this.message = data
    this.statusCode = code
  }

  public getBody() {
    return this.message
  }

  public async handleResponse(res: Response, body: any = null): Promise<void> {
    res.status(this.statusCode).send({
      status: 'success',
      statusCode: this.statusCode,
      data: (body != null) ? body : this.message
    })
  }
}