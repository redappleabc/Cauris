import { ControllerProtected } from '@servichain/helpers/controllers'
import {RefreshService} from '@servichain/modules/refreshs'
import { Request, Response, NextFunction } from 'express'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EUserRole } from '@servichain/enums'
import config from 'config'
import { ServiceProtected } from '@servichain/helpers/services'

const defaultExpiresIn: number = config.get('defaultExpiresIn')

export class RefreshController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.refresh = this.refresh.bind(this)
    this.revoke = this.revoke.bind(this)
  }

  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token: string = req.cookies.refreshToken
      const ip: string = req.ip;
      let handler: ValidResponse = await (this.service as RefreshService).refresh(token, ip);
      const {refreshToken, user} = handler.getBody()
      this.setTokenCookie(res, refreshToken)
      handler.handleResponse(res, user)
    } catch (err) {
      next(err)
    }
  }

  public async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.token || req.cookies.refreshToken;
      const ip = req.ip;

      if (!token) return res.status(400).json({ message: 'Token is required' });
      if (!res['locals'].user.ownsToken(token) && res['locals'].user.role !== EUserRole.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
      };
      await (this.service as RefreshService).revoke(token, ip)
      let handler: ValidResponse = new ValidResponse(200, "Token revoked")
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