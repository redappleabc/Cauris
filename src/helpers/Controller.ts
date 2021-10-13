import { IController } from "../interfaces/IController";
import { Request, Response } from 'express'
import Service from "./Service";
import { IResponseHandler } from "../interfaces/IResponseHandler";
import { ErrorResponse } from "./RequestHelpers/ErrorResponse";

export default class Controller implements IController {
  service: Service

  constructor(service: Service) {
    this.service = service
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.insert = this.insert.bind(this)
    this.delete = this.delete.bind(this)
  }

  public async getAll(req: Request, res: Response) {
    try {
      let handler: IResponseHandler = await this.service.getAll(req.query)
      return handler.handleResponse(res)
    } catch (err) {
      const handler = new ErrorResponse(err.code, err.message)
      handler.handleResponse(res)
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      let handler: IResponseHandler = await this.service.getById(id)
      return handler.handleResponse(res)
    } catch (err) {
      const handler = new ErrorResponse(err.code, err.message)
      handler.handleResponse(res)
    }
  }

  public async insert(req: Request, res: Response) {
    try {
      let handler: IResponseHandler = await this.service.insert(req.body)
      return handler.handleResponse(res)
    } catch (err) {
      const handler = new ErrorResponse(err.code, err.message)
      handler.handleResponse(res)
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      let handler: IResponseHandler = await this.service.update(id, req.body)
      return handler.handleResponse(res)
    } catch (err) {
      const handler = new ErrorResponse(err.code, err.message)
      handler.handleResponse(res)
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      let handler: IResponseHandler = await this.service.delete(id)
      return handler.handleResponse(res)
    } catch (err) {
      const handler = new ErrorResponse(err.code, err.message)
      handler.handleResponse(res)
    }
  }
}