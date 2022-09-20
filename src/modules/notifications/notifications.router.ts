import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {NotificationsController, NotificationsService, generateSchema, updateSchema} from '@servichain/modules/notifications'

const router = express.Router()
const service = new NotificationsService()
const controller = new NotificationsController(service)

router.post('/', JwtHelper.middleware(), generateSchema, controller.insert)
router.put('/:id', JwtHelper.middleware(), updateSchema, controller.updateProtected)
router.get('/', JwtHelper.middleware(), controller.getAllByUser)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.delete('/:id', JwtHelper.middleware(),controller.delete)

export default router