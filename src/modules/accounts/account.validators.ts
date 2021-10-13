import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '../../middlewares/JoiValidator';

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    coinIndex: Joi.number().positive().required(),
    accountIndex: Joi.number().min(0),
    change: Joi.number().min(0).max(1),
    addressIndex: Joi.number().min(0)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}