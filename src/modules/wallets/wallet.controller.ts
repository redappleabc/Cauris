import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import WalletService from './wallet.service'
import db from '../../helpers/MongooseClient'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '../../interfaces/IResponseHandler'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'

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