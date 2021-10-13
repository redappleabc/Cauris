import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import TransactionService from './transaction.service'
import { Request, Response } from 'express'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'
import { IResponseHandler } from '../../interfaces/IResponseHandler'

class TransactionController extends Controller {
  constructor(service: Service) {
    super(service)
    this.send = this.send.bind(this)
  }

  public async send(req: Request, res: Response) {
    try {
      let {coinId, networkId, from, to, value} = req.body;
      const handler: IResponseHandler = await (this.service as TransactionService).send(req.user['id'], coinId, networkId, from, to, value)
      handler.handleResponse(res)
    } catch (err) {
      const handler = new ErrorResponse(err.code, err.message)
      handler.handleResponse(res)
    }
  }
}

const service = new TransactionService()

export default new TransactionController(service)