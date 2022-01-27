import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'
import {TransactionController, TransactionService, sendSchema, updateSchema, estimateSchema} from '@servichain/modules/transactions'

const router = express.Router()
const service = new TransactionService()
const controller = new TransactionController(service)

/* Refresh Routes */
router.get('/', JwtHelper.middleware(), controller.getAllByCoin)
router.get('/estimate', JwtHelper.middleware(), controller.getGasFees)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.post('/', JwtHelper.middleware(), sendSchema, controller.send)
router.put('/:id', JwtHelper.middleware(),updateSchema, controller.updateProtected)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as TransactionRouter}