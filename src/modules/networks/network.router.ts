import express, { Router } from 'express'
import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import NetworkController from './network.controller'
import {insertSchema} from './network.validators'

const router = express.Router()

router.get('/', NetworkController.insert)
router.get('/:id', JwtHelper.middleware(), NetworkController.getById)
router.post('/', JwtHelper.middleware([EUserRole.Partner, EUserRole.Admin]), insertSchema, NetworkController.insert)
router.put('/:id', JwtHelper.middleware([EUserRole.Admin]), NetworkController.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), NetworkController.delete)

export default router