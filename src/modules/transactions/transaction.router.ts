import express from 'express'

import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import TransactionController from './transaction.controller'
import {sendSchema} from './transaction.validators'

const router = express.Router()

/* Refresh Routes */
router.get('/', JwtHelper.middleware([EUserRole.Admin, EUserRole.Partner]), TransactionController.getAll)
router.get('/:id', JwtHelper.middleware(), TransactionController.getById)
router.post('/', JwtHelper.middleware(), sendSchema, TransactionController.send)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), TransactionController.delete)

export default router