import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function insertSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    name: Joi.string().required(),
    chainId: Joi.number().min(1).required(),
    rpcUrl: Joi.string().uri().required(),
    apiUrl: Joi.string().uri(),
    explorerUrl: Joi.string().uri(),
    configKey: Joi.string().alphanum(),
    currencySymbol: Joi.string().required().max(10),
    type: Joi.number().min(0).max(1)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    name: Joi.string(),
    chainId: Joi.number().min(1),
    rpcUrl: Joi.string().uri(),
    apiUrl: Joi.string().uri(),
    explorerUrl: Joi.string().uri(),
    configKey: Joi.string().alphanum(),
    currencySymbol: Joi.string().max(10),
    type: Joi.number().min(0).max(1)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}