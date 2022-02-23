import {AccountService} from '@servichain/modules/accounts'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers/ControllerProtected'

export class AccountController extends ControllerProtected {
  constructor(service: AccountService) {
    super(service)
    this.generate = this.generate.bind(this)
    this.getByAddressProtected = this.getByAddressProtected.bind(this)
    this.getByCoinId = this.getByCoinId.bind(this)
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const {wallet, accounts} = req.body;
      let handler: IResponseHandler = await (this.service as AccountService).generate(req.user['id'], wallet, accounts)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async getByAddressProtected(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params
      const userId = res.locals.user.id
      let handler: IResponseHandler = await (this.service as AccountService).getByAddressProtected(address, userId)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async getByCoinId(req: Request, res: Response, next: NextFunction) {
    try {
      let handler: IResponseHandler = await (this.service as AccountService).getByCoinId(req.query)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}