import { ServiceProtected } from '@servichain/helpers/services'
import { WalletService } from '@servichain/modules/wallets'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers'

export class WalletController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.generate = this.generate.bind(this)
    this.deleteLogically = this.deleteLogically.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
  }

  public async getAllByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id
      let handler: IResponseHandler = await (this.service as WalletService).getAllByUser(req.query, userId)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      let {mnemonic, name} = req.body;
      const handler: IResponseHandler = await (this.service as WalletService).generate(req.user['id'], mnemonic, name)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async deleteLogically(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const handler: IResponseHandler = await (this.service as WalletService).deleteLogically(id, req.user['id'])
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}