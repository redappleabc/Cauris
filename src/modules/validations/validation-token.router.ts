import express from 'express'

import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import ValidationController from './validation-token.controller'

const router = express.Router()

/* password forgot route, email verification route */

export default router