import express from 'express'

import {ValidationController, ValidationService} from '@servichain/modules/validations'
import { generateSchema } from './validation-token.validators'

const router = express.Router()
const service = new ValidationService()
const controller = new ValidationController(service)

/* password forgot route, email verification route */
router.post('/', generateSchema, controller.generateToken)

export {router as ValidationRouter}