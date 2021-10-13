import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import TransactionService from './transaction.service'
import { Request, Response } from 'express'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'

class TransactionController extends Controller {
  constructor(service: Service) {
    super(service)
    this.send = this.send.bind(this)
  }

  send(req: Request, res: Response) {
    let {coinId, networkId, from, to, value} = req.body;
    (this.service as TransactionService).send(req.user['id'], coinId, networkId, from, to, value)
    .then((responseHandler: ValidResponse) => {
      responseHandler.handleResponse(res)
    })
  }
}

const service = new TransactionService()

export default new TransactionController(service)