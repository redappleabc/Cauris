import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import TransactionController from '@servichain/modules/transactions/transaction.controller'
import {sendSchema} from '@servichain/modules/transactions/transaction.validators'

const router = express.Router()

/* Refresh Routes */
router.get('/', JwtHelper.middleware([EUserRole.Admin, EUserRole.Partner]), TransactionController.getAll)
router.get('/:id', JwtHelper.middleware(), TransactionController.getById)
router.post('/', JwtHelper.middleware(), sendSchema, TransactionController.send)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), TransactionController.delete)

export default router