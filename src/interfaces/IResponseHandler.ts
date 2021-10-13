import { Response } from 'express'

export interface IResponseHandler {
  statusCode: number
  message: any
  getBody(): any
  handleResponse(res: Response): void
}