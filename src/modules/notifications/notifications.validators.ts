import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    title: Joi.string().empty('').required(),
    content:Joi.string().empty(''),
    user:Joi.string().empty('').required(),
    data:Joi.object()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    title: Joi.string().empty('').required(),
    content:Joi.string().empty(''),
    user:Joi.string().empty('').required(),
    data:Joi.object()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}