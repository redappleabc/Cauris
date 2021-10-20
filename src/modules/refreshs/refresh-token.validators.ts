import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function revokeTokenSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    token: Joi.string().empty('')
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}