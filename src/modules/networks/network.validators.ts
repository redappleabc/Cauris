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
    blockExplorer: Joi.string().uri(),
    currencySymbol: Joi.string().required().max(10),
    type: Joi.number().min(0).max(1)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}