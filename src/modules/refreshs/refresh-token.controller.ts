import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import RefreshService from './refresh-token.service'
import db from '../../helpers/MongooseClient'
import config from 'config'
import { Request, Response } from 'express'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'
import { EUserRole } from '../../enums/EUserRole'

const defaultExpiresIn: number = config.get('defaultExpiresIn')

class RefreshController extends Controller {
  constructor(service: Service) {
    super(service)
    this.refresh = this.refresh.bind(this)
    this.revoke = this.revoke.bind(this)
  }

  public async refresh(req: Request, res: Response) {
    const token: string = req.cookies.refreshToken
    const ip: string = req.ip;
    (this.service as RefreshService).refresh(token, ip)
    .then((responseHandler: ValidResponse) => {
      const {refreshToken, user} = responseHandler.getBody()
      this.setTokenCookie(res, refreshToken)
      responseHandler.handleResponse(res, user)
    })
  }

  public async revoke(req: Request, res: Response) {
    const token = req.body.token || req.cookies.refreshToken;
    const ip = req.ip;

    if (!token) return res.status(400).json({ message: 'Token is required' });
    if (!res['locals'].user.ownsToken(token) && res['locals'].user.role !== EUserRole.Admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    };
    (this.service as RefreshService).revoke(token, ip)
    .then(() => {
      const responseHandler =  new ValidResponse(200, "Token revoked")
      responseHandler.handleResponse(res)
    })

  }

  protected setTokenCookie(res: Response, token: any) {
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + defaultExpiresIn)
    }

    res.cookie('refreshToken', token, cookieOptions)
  }
}

const service = new RefreshService(db.RefreshToken)

export default new RefreshController(service)