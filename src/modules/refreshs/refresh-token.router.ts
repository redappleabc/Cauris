import express from 'express'

import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import RefreshController from './refresh-token.controller'
import {revokeTokenSchema} from './refresh-token.validators'

const router = express.Router()

/* Refresh Routes */
router.get('/', JwtHelper.middleware([EUserRole.Admin]), RefreshController.getAll)
router.get('/:id', JwtHelper.middleware(), RefreshController.getById)
router.post('/', RefreshController.refresh)
router.post('/revoke', revokeTokenSchema, RefreshController.revoke)
//router.put('/:id', RefreshController.update)
router.delete('/:id', RefreshController.delete)

export default router