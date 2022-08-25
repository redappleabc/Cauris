import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function insertSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().required().max(20).empty(''),
    description: Joi.string().max(1000),
    paymentType: Joi.string(),
    coins: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        amount: Joi.string().alphanum().required()
    })).required().empty([])
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    amount: Joi.number().positive(),
    currency: Joi.string().max(20).empty(''),
    description: Joi.string().max(1000).empty(''),
    paymentType: Joi.string(),
    coins: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        amount: Joi.string().alphanum().required()
    })),
    state: Joi.number().min(-1).max(3),
    paymentPlatform: Joi.string()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function cinetNotifySchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    cpm_trans_id: Joi.string().empty('').required(),
    cpm_site_id: Joi.string().empty('').required(),
    cpm_trans_date:Joi.string().empty('').required(),
    cpm_amount:Joi.string().empty('').required(),
    cpm_currency:Joi.string().empty('').required(),
    signature:Joi.string().empty('').required(),
    payment_method:Joi.string().empty('').required(),
    cel_phone_num:Joi.string().empty('').required(),
    cpm_phone_prefixe:Joi.string().empty('').required(),
    cpm_language:Joi.string().empty('').required(),
    cpm_version:Joi.string().empty('').required(),
    cpm_payment_config:Joi.string().empty('').required(),
    cpm_page_action:Joi.string().empty('').required(),
    cpm_custom:Joi.string().empty(''),
    cpm_designation:Joi.string().empty('')
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function cinetPaySchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    amount:Joi.number().positive().required(),
    currency:Joi.string().empty('').required(),
    channels:Joi.string().empty('').required(),
    description:Joi.string().empty('').required(),
    payment_type:Joi.string().empty('').required(),
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}