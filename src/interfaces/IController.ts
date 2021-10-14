import Service from "../helpers/Service";
import {Request, Response, NextFunction} from 'express'

export interface IController {
  readonly service: Service
  getAll(req: Request, res: Response, next: NextFunction): void
  insert(req: Request, res: Response, next: NextFunction): void
  update(req: Request, res: Response, next: NextFunction): void
  delete(req: Request, res: Response, next: NextFunction): void
}