import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import AccountService from './account.service'
import { Request, Response, NextFunction } from 'express'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'

class AccountController extends Controller {
  constructor(service: AccountService) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  generate(req: Request, res: Response, next: NextFunction) {
    const {coinIndex, accountIndex, change, addressIndex} = req.body;
    (this.service as AccountService).generate(req.user['id'], coinIndex, accountIndex, change, addressIndex)
    .then((responseHandler: ValidResponse) => {
      responseHandler.handleResponse(res)
    })
  }
}

const service = new AccountService()

export default new AccountController(service)