import { IController } from "@servichain/interfaces/IController";
import { Request, Response, NextFunction } from 'express'
import Service from "@servichain/helpers/services/Service";
import { IResponseHandler } from "@servichain/interfaces/IResponseHandler";

export default class Controller implements IController {
  service: Service

  constructor(service: Service) {
    this.service = service
    this.getAll = this.getAll.bind(this)
    this.insert = this.insert.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
    this.getById = this.getById.bind(this)
  }

  public async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      let handler: IResponseHandler = await this.service.getAll(req.query)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      let handler: IResponseHandler = await this.service.getById(id)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async insert(req: Request, res: Response, next: NextFunction) {
    try {
      let handler: IResponseHandler = await this.service.insert(req.body)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      let handler: IResponseHandler = await this.service.update(id, req.body)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      let handler: IResponseHandler = await this.service.delete(id)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}