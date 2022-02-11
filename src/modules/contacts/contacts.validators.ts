import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.alternatives().try(
    Joi.object({
      name: Joi.string().empty('').max(50).required(),
      username:Joi.string().empty('').required()
    }),
    Joi.object({
      name: Joi.string().empty('').max(50).required(),
      address:Joi.string().alphanum().empty('').required()
    })
  )
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    name: Joi.string().empty('').max(50),
    username:Joi.string().empty(''),
    address:Joi.string().alphanum().empty(''),
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}