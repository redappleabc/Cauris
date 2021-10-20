import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'
import {WalletController, WalletService, generateSchema} from '@servichain/modules/wallets'

const router = express.Router()
const service = new WalletService()
const controller = new WalletController(service)

router.post('/', JwtHelper.middleware(), generateSchema, controller.generate)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.delete('/', JwtHelper.middleware([EUserRole.Admin]),controller.delete)

export default router