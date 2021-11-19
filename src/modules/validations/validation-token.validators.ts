import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    tokenType: Joi.string().valid('reset-password', 'verification').required(),
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}