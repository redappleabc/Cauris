import express, { Router } from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import NetworkController from '@servichain/modules/networks/network.controller'
import {insertSchema} from '@servichain/modules/networks/network.validators'

const router = express.Router()

router.get('/', NetworkController.insert)
router.get('/:id', JwtHelper.middleware(), NetworkController.getById)
router.post('/', JwtHelper.middleware([EUserRole.Partner, EUserRole.Admin]), insertSchema, NetworkController.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), NetworkController.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), NetworkController.delete)

export default router