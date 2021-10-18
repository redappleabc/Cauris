import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import ValidationController from './validation-token.controller'

const router = express.Router()

/* password forgot route, email verification route */

export default router