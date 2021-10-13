import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '../../middlewares/JoiValidator';

export function sendSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    coinId: Joi.string().alphanum().required(),
    networkId: Joi.string().alphanum().required(),
    from: Joi.string().required().alphanum(),
    to: Joi.string().required().alphanum(),
    value: Joi.number().required().min(0)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}