import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {EUserRole} from '@servichain/enums/EUserRole'
import {ContactsController, ContactsService, generateSchema, updateSchema} from '@servichain/modules/contacts'

const router = express.Router()
const service = new ContactsService()
const controller = new ContactsController(service)

router.post('/', JwtHelper.middleware(), generateSchema, controller.generate)
router.put('/:id', JwtHelper.middleware(), updateSchema, controller.updateProtected)
router.get('/', JwtHelper.middleware(), controller.getAllByUser)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.delete('/', JwtHelper.middleware([EUserRole.Admin]),controller.delete)

export default router