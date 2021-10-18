import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import WalletController from './wallet.controller'
import {generateSchema} from './wallet.validators'

const router = express.Router()

router.post('/', JwtHelper.middleware(), generateSchema, WalletController.generate)
router.get('/:id', JwtHelper.middleware(), WalletController.getById)
router.delete('/', JwtHelper.middleware([EUserRole.Admin]),WalletController.delete)

export default router