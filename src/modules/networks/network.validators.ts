import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '../../middlewares/JoiValidator';

export function insertSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    name: Joi.string().required(),
    url: Joi.string().uri(),
    chainId: Joi.number().min(1),
    blockExplorer: Joi.string().uri(),
    currencySymbol: Joi.string()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}