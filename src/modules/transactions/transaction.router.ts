import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'

import {TransactionController, TransactionService, sendSchema} from '@servichain/modules/transactions'

const router = express.Router()
const service = new TransactionService()
const controller = new TransactionController(service)

/* Refresh Routes */
router.get('/', JwtHelper.middleware([EUserRole.Admin, EUserRole.Partner]), controller.getAll)
router.get('/:id', JwtHelper.middleware(), controller.getById)
router.post('/', JwtHelper.middleware(), sendSchema, controller.send)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as TransactionRouter}