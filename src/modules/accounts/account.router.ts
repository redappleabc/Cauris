import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import AccountController from '@servichain/modules/accounts/account.controller'
import {generateSchema} from '@servichain/modules/accounts/account.validators'

const router = express.Router()

router.get('/:id', JwtHelper.middleware(), AccountController.getById)
router.post('/', JwtHelper.middleware(), generateSchema, AccountController.generate)
router.delete('/', JwtHelper.middleware([EUserRole.Admin]), AccountController.delete)

export default router