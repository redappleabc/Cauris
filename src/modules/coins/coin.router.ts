import express, { Router } from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import CoinController from '@servichain/modules/coins/coin.controller'
import {insertSchema} from '@servichain/modules/coins/coin.validators'

const router = express.Router()

router.get('/', CoinController.insert)
router.get('/:id', JwtHelper.middleware(), CoinController.getById)
router.post('/', JwtHelper.middleware([EUserRole.Partner, EUserRole.Admin]), insertSchema, CoinController.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), CoinController.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), CoinController.delete)

export default router