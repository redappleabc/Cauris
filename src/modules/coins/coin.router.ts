import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import {CoinService, CoinController, insertSchema} from '@servichain/modules/coins'

const router = express.Router()
const service = new CoinService()
const controller = new CoinController(service)

router.get('/', controller.insert)
router.get('/:id', JwtHelper.middleware(), controller.getById)
router.post('/', JwtHelper.middleware([EUserRole.Partner, EUserRole.Admin]), insertSchema, controller.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as CoinRouter}