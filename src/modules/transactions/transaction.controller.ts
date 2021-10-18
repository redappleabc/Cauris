import {Controller} from '@servichain/helpers/controllers'
import { Service } from '@servichain/helpers/services'
import {TransactionService} from '@servichain/modules/transactions'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'

export class TransactionController extends Controller {
  constructor(service: Service) {
    super(service)
    this.send = this.send.bind(this)
  }

  public async send(req: Request, res: Response, next: NextFunction) {
    try {
      let {coinId, networkId, from, to, value} = req.body;
      const handler: IResponseHandler = await (this.service as TransactionService).send(req.user['id'], coinId, networkId, from, to, value)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}