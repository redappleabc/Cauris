import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import AccountService from './account.service'
import { Request, Response, NextFunction } from 'express'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'
import { IResponseHandler } from '../../interfaces/IResponseHandler'

class AccountController extends Controller {
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

const service = new AccountService()

export default new AccountController(service)