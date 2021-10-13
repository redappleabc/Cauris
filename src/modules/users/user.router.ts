import express from 'express'
import JwtHelper from '../../middlewares/JwtHelper'
import {EUserRole} from '../../enums/EUserRole'

import UserController from './user.controller'
import {authenticateSchema, registerSchema, updateSchema} from './user.validators'

const router = express.Router()

/* User Routes */
router.get('/', JwtHelper.middleware([EUserRole.Admin, EUserRole.Partner]), UserController.getAll)
router.get('/:id', JwtHelper.middleware([EUserRole.User]), UserController.getById)
router.post('/', registerSchema, UserController.insert)
router.post('/authenticate', authenticateSchema, UserController.authenticate)
router.put('/:id', JwtHelper.middleware(), updateSchema, UserController.update)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), UserController.delete)

export default router