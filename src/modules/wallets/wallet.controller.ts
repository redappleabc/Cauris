import { ServiceProtected } from '@servichain/helpers/services'
import { WalletService } from '@servichain/modules/wallets'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers'

export class WalletController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      let {mnemonic} = req.body;
      const handler: IResponseHandler = await (this.service as WalletService).generate(req.user['id'], mnemonic)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}