import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';

export function authenticateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function passwordSchema(req, Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function registerSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    firstName: Joi.string().max(30),
    lastName: Joi.string().max(30),
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().email().empty(''),
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty('')
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}