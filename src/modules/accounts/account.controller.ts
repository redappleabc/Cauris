import {Controller} from '@servichain/helpers/controllers'
import {AccountService} from '@servichain/modules/accounts'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'

export class AccountController extends Controller {
  constructor(service: AccountService) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const {coinIndex, accountIndex, change, addressIndex} = req.body;
      let handler: IResponseHandler = await (this.service as AccountService).generate(req.user['id'], coinIndex, accountIndex, change, addressIndex)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}