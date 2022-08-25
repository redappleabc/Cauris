import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {PaymentsService, PaymentsController, cinetNotifySchema, insertSchema, updateSchema} from '@servichain/modules/payments'
import { EUserRole } from '@servichain/enums'

const router = express.Router()
const service = new PaymentsService()
const controller = new PaymentsController(service)

router.post('/', JwtHelper.middleware(), insertSchema, controller.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), updateSchema, controller.update)
router.get('/', JwtHelper.middleware(), controller.getAllByUser)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.delete('/:id', JwtHelper.middleware(),controller.delete)
router.post('/cinet', cinetNotifySchema, controller.notifyCinet)
router.get('/cinet', controller.pingCinet)

export default router