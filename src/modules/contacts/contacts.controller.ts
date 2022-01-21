import { ServiceProtected } from '@servichain/helpers/services'
import { ContactsService } from '@servichain/modules/contacts'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers'

export class ContactsController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.generate = this.generate.bind(this)
  }

  public async generate(req: Request, res: Response, next: NextFunction) {
    try {
      let {address, email, name} = req.body;
      const handler: IResponseHandler = await (this.service as ContactsService).generate(req.user['id'], address, name, email)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}