import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums'

import {NetworkService, NetworkController, insertSchema, updateSchema} from '@servichain/modules/networks'

const router = express.Router()
const service = new NetworkService()
const controller = new NetworkController(service)

router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', JwtHelper.middleware([EUserRole.Partner, EUserRole.Admin]), insertSchema, controller.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), updateSchema, controller.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as NetworkRouter}