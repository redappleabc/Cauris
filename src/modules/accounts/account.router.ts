import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'

import {AccountController, AccountService, generateSchema} from '@servichain/modules/accounts'

const router = express.Router()
const service = new AccountService()
const controller = new AccountController(service)

router.get('/:id', JwtHelper.middleware(), controller.getById)
router.post('/', JwtHelper.middleware(), generateSchema, controller.generate)
router.delete('/', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as AccountRouter}