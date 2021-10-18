import config from 'config'
import db from '@servichain/helpers/MongooseClient'
import Controller from '@servichain/helpers/controllers/Controller'
import UserService from './user.service'
import { Request, Response, NextFunction } from 'express'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'


const defaultExpiresIn: number = config.get('defaultExpiresIn')

class UserController extends Controller {
  constructor(service: UserService) {
    super(service)
    this.authenticate = this.authenticate.bind(this)
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const {email, password} = req.body
      const ipAddress: string = req.ip;
      const handler: ValidResponse = await (this.service as UserService).authenticate({email, password, ipAddress})
      const refreshToken = handler.getBody()
      this.setTokenCookie(res, refreshToken)
      delete handler.message.refreshToken
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  protected setTokenCookie(res: Response, token: any) {
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + defaultExpiresIn)
    }

    res.cookie('refreshToken', token, cookieOptions)
  }
}

const service = new UserService(db.User)

export default new UserController(service)