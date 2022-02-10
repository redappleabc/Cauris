import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'

import {AccountController, AccountService, generateSchema, updateSchema} from '@servichain/modules/accounts'

const router = express.Router()
const service = new AccountService()
const controller = new AccountController(service)

router.get('/', JwtHelper.middleware(), controller.getAllByUser)
router.get('/contact', JwtHelper.middleware(), controller.getByCoinId)
router.get('/address/:address', JwtHelper.middleware(), controller.getByAddressProtected)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.put('/:id', JwtHelper.middleware(), updateSchema, controller.updateProtected)
router.post('/', JwtHelper.middleware(), generateSchema, controller.generate)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as AccountRouter}