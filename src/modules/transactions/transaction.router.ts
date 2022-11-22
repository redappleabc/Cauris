import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'
import {TransactionController, TransactionService, sendSchema, updateSchema, estimateSchema, claimFeeSchema} from '@servichain/modules/transactions'
import { swapEstimateSchema, swapApproveSchema, swapSendSchema } from './transaction.validators'

const router = express.Router()
const service = new TransactionService()
const controller = new TransactionController(service)

/* Refresh Routes */
router.get('/', JwtHelper.middleware(), controller.getAllByCoin)
router.get('/unspent', JwtHelper.middleware(), controller.getBtcUnspentTransactions)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.post('/', JwtHelper.middleware(), sendSchema, controller.send)
router.post('/estimate', JwtHelper.middleware(), sendSchema, controller.estimate)
router.post('/swap/estimate', JwtHelper.middleware(), swapEstimateSchema, controller.estimateSwap)
router.post('/swap/approve', JwtHelper.middleware(), swapApproveSchema, controller.approveSwap)
router.post('/swap/send', JwtHelper.middleware(), swapSendSchema, controller.sendSwap)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]),updateSchema, controller.updateProtected)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

router.post('/claimFee', JwtHelper.middleware([EUserRole.Admin]),claimFeeSchema, controller.claimFeeProtected)
router.post('/claimFee/estimate', JwtHelper.middleware([EUserRole.Admin]),claimFeeSchema, controller.claimFeeEstimateProtected)


export {router as TransactionRouter}