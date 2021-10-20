import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'

import {RefreshService, RefreshController, revokeTokenSchema} from '@servichain/modules/refreshs'

const router = express.Router()
const service = new RefreshService()
const controller = new RefreshController(service)

/* Refresh Routes */
router.get('/', JwtHelper.middleware([EUserRole.Admin]), controller.getAll)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.post('/', controller.refresh)
router.post('/revoke', revokeTokenSchema, controller.revoke)
router.delete('/:id', controller.delete)

export {router as RefreshTokenRouter}