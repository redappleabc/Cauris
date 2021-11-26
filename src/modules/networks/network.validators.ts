import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function insertSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    name: Joi.string().required(),
    url: Joi.string().uri(),
    configKey: Joi.string().alphanum(),
    chainId: Joi.number().min(1).required(),
    blockExplorer: Joi.string().uri(),
    currencySymbol: Joi.string()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}