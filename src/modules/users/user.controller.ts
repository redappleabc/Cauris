import config from 'config'
import {Controller} from '@servichain/helpers/controllers'
import {UserService} from '@servichain/modules/users'
import { Request, Response, NextFunction } from 'express'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'


const refreshTokenExpiresIn: number = config.get('refreshTokenExpiresIn')

export class UserController extends Controller {
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

  public async passwordForgotten(req: Request, res: Response, next: NextFunction) {
    try {
      const {newPassword} = req.body
      const handler: ValidResponse = await (this.service as UserService).changePassword(req.params.id, newPassword)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async verifyUser(req: Request, res: Response, next: NextFunction) {
    try {
      const handler: ValidResponse = await (this.service as UserService).verifyUser(req.params.id)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  //internal
  protected setTokenCookie(res: Response, token: any) {
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + refreshTokenExpiresIn)
    }

    res.cookie('refreshToken', token, cookieOptions)
  }
}