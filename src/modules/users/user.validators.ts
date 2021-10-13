import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '../../middlewares/JoiValidator';

export function authenticateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function registerSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    verified: Joi.boolean().valid(true).required(),
    firstName: Joi.string(),
    lastName: Joi.string(),
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().email().empty(''),
    password: Joi.string().min(6).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty('')
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}