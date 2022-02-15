import express from 'express'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {ETokenType, EUserRole} from '@servichain/enums'

import {UserService, UserController, authenticateSchema, registerSchema, updateSchema, passwordSchema, updatePasswordSchema} from '@servichain/modules/users'
import { sameUserMiddleware } from '@servichain/middlewares/SameUser'
import { validationMiddleware } from '@servichain/middlewares/TokenVerification'
import { verifySchema } from './user.validators'

const router = express.Router()
const service = new UserService()
const controller = new UserController(service)

router.get('/', JwtHelper.middleware([EUserRole.Admin, EUserRole.Partner]), controller.getAll)
router.get('/:id', JwtHelper.middleware(), sameUserMiddleware, controller.getById)
router.get('/:id/details', JwtHelper.middleware(), sameUserMiddleware, controller.getByIdDetailed)
router.post('/', registerSchema, controller.insert)
router.post('/authenticate', authenticateSchema, controller.authenticate)
router.put('/:id', JwtHelper.middleware(), sameUserMiddleware, updateSchema, controller.update)
router.put('/:id/update-password', JwtHelper.middleware(),sameUserMiddleware, updatePasswordSchema, controller.updatePassword)
router.put('/:id/verify', verifySchema, validationMiddleware(ETokenType.Verification), controller.verifyUser)
router.put('/:id/password-reset', passwordSchema, validationMiddleware(ETokenType.Reset), controller.passwordForgotten)
router.delete('/:id', JwtHelper.middleware([EUserRole.Admin]), controller.delete)

export {router as UserRouter}