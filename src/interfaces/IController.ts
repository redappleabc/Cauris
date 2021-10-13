import Service from "../helpers/Service";
import {Request, Response} from 'express'

export interface IController {
  readonly service: Service
  getAll(req: Request, res: Response): void
  insert(req: Request, res: Response): void
  update(req: Request, res: Response): void
  delete(req: Request, res: Response): void
}