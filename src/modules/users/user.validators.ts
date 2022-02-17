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

export function verifySchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    token: Joi.string().empty('').required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function passwordSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    token: Joi.string().empty('').required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function registerSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().empty('').required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    firstName: Joi.string().max(30),
    lastName: Joi.string().max(30),
    devices:Joi.array().items(Joi.string()),
    pin: Joi.string().regex(/^\d+$/).empty("").min(4).max(8)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}

export function updateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().email().empty(''),
    username: Joi.string().empty(''),
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty(''),
    devices:Joi.array().items(Joi.string()),
    pin: Joi.string().regex(/^\d+$/).min(4).max(8)
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}
export function updatePasswordSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    oldPassword: Joi.string().empty('').required(),
    newPassword: Joi.string().empty('').required(),
    newPasswordRepeat: Joi.string().empty('').required()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}
export function TwoFAgenerationSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    email: Joi.string().empty('').email()
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}