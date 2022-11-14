import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

let joiAccount = Joi.object({
  coinIndex: Joi.number().min(0).required(),
  accountIndex: Joi.number().min(0),
  change: Joi.number().min(0).max(1),
  addressIndex: Joi.number().min(0),
  subscribedTo: Joi.array().items(Joi.string().alphanum())
})

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    wallet: Joi.string().empty('').alphanum().required(),
    accounts: [joiAccount, Joi.array().items(joiAccount)],
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    subscribedTo: Joi.array().items(Joi.string().alphanum()).required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}