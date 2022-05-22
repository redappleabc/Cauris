import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'
import {TransactionController, TransactionService, sendSchema, updateSchema, estimateSchema} from '@servichain/modules/transactions'
import { swapPriceSchema, swapTxSchema } from './transaction.validators'

const router = express.Router()
const service = new TransactionService()
const controller = new TransactionController(service)

/* Refresh Routes */
router.get('/', JwtHelper.middleware(), controller.getAllByCoin)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.post('/', JwtHelper.middleware(), sendSchema, controller.send)
router.post('/estimate', JwtHelper.middleware(), sendSchema, controller.estimate)
router.post('/swap/price', JwtHelper.middleware(), swapPriceSchema, controller.getPriceRoute)
router.post('/swap', JwtHelper.middleware(), swapTxSchema, controller.swap)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]),updateSchema, controller.updateProtected)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as TransactionRouter}