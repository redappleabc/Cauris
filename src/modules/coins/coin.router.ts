import express, { Router } from 'express'
import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import CoinController from './coin.controller'
import {insertSchema} from './coin.validators'

const router = express.Router()

router.get('/', CoinController.insert)
router.get('/:id', JwtHelper.middleware(), CoinController.getById)
router.post('/', JwtHelper.middleware([EUserRole.Partner, EUserRole.Admin]), insertSchema, CoinController.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), CoinController.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), CoinController.delete)

export default router