import { IResponseHandler } from "@servichain/interfaces";
import { Request, Response, NextFunction } from 'express'
import { ServiceProtected } from '@servichain/helpers/services';
import { Controller } from "./Controller";

export class ControllerProtected extends Controller {
  constructor(service: ServiceProtected) {
    super(service)
    this.getByIdProtected = this.getByIdProtected.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
  }

  public async getByIdProtected(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = res.locals.user.id
      let handler: IResponseHandler = await (this.service as ServiceProtected).getByIdProtected(id, userId)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async getAllByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id
      let handler: IResponseHandler = await (this.service as ServiceProtected).getAllByUser(req.query, userId)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}