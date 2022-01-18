import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function sendSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    coinId: Joi.string().alphanum().required(),
    from: Joi.string().required().alphanum(),
    to: Joi.string().required().alphanum(),
    value: Joi.string().regex(/^(\d+(?:[\.\,]\d+)?)$/).empty('').required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    status: Joi.string().required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}