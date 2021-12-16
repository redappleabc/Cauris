import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

let joiAccount = Joi.object({
  coinIndex: Joi.number().positive().required(),
  accountIndex: Joi.number().min(0),
  change: Joi.number().min(0).max(1),
  addressIndex: Joi.number().min(0)
})

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    wallet: Joi.string().empty('').required(),
    accounts: [joiAccount, Joi.array().items(joiAccount)]
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}