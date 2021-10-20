import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'

import {ValidationController, ValidationService} from '@servichain/modules/validations'

const router = express.Router()
const service = new ValidationService()
const controller = new ValidationController(service)

/* password forgot route, email verification route */

export default router