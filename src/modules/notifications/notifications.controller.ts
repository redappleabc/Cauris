import { ServiceProtected } from '@servichain/helpers/services'
import { NotificationsService } from '@servichain/modules/notifications'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers'

export class NotificationsController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      let {title, content, user} = req.body;
      const handler: IResponseHandler = await (this.service as NotificationsService).generate(user, title, content)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}