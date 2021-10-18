import {Controller} from '@servichain/helpers/controllers'
import { Service } from '@servichain/helpers/services'
import {WalletService} from '@servichain/modules/wallets'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'

export class WalletController extends Controller {
  constructor(service: Service) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      let {mnemonic, network} = req.body;
      const handler: IResponseHandler = await (this.service as WalletService).generate(req.user['id'], network, mnemonic)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}