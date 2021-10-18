import Controller from '@servichain/helpers/controllers/Controller'
import Service from '@servichain/helpers/services/Service'
import WalletService from './wallet.service'
import db from '@servichain/helpers/MongooseClient'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces/IResponseHandler'
import { ErrorResponse } from '@servichain/helpers/responses/ErrorResponse'

class WalletController extends Controller {
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

const service = new WalletService(db.Wallet)
export default new WalletController(service)