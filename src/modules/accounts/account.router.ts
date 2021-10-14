import express from 'express'
import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import AccountController from './account.controller'
import {generateSchema} from './account.validators'

const router = express.Router()

router.get('/:id', JwtHelper.middleware(), AccountController.getById)
router.post('/', JwtHelper.middleware(), generateSchema, AccountController.generate)
router.delete('/', JwtHelper.middleware([EUserRole.Admin]), AccountController.delete)

export default router