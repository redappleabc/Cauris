import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function insertSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    coinIndex: Joi.number().positive().required(),
    name: Joi.string().alphanum().required(),
    symbol: Joi.string().alphanum().required(),
    contractAddress: Joi.string().alphanum()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}