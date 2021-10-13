import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import WalletService from './wallet.service'
import db from '../../helpers/MongooseClient'
import { Request, Response } from 'express'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'

class WalletController extends Controller {
  constructor(service: Service) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  generate(req: Request, res: Response) {
    let {mnemonic, network} = req.body;
    (this.service as WalletService).generate(req.user['id'], network, mnemonic)
    .then((responseHandler: ValidResponse) => {
      responseHandler.handleResponse(res)
    })
  }
}

const service = new WalletService(db.Wallet)
export default new WalletController(service)