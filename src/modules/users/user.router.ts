import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'

import UserController from '@servichain/modules/users/user.controller'
import {authenticateSchema, registerSchema, updateSchema} from '@servichain/modules/users/user.validators'
import { sameUserMiddleware } from '@servichain/middlewares/SameUser'

const router = express.Router()

router.get('/', JwtHelper.middleware([EUserRole.Admin, EUserRole.Partner]), UserController.getAll)
router.get('/:id', JwtHelper.middleware([EUserRole.User]), UserController.getById)
router.post('/', registerSchema, UserController.insert)
router.post('/authenticate', authenticateSchema, UserController.authenticate)
router.put('/:id', JwtHelper.middleware(), sameUserMiddleware, updateSchema, UserController.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), UserController.delete)

export default router