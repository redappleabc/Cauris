import express from 'express'

import JwtHelper from '@servichain/middlewares/JwtHelper'
import {ContactsController, ContactsService, generateSchema, updateSchema} from '@servichain/modules/contacts'

const router = express.Router()
const service = new ContactsService()
const controller = new ContactsController(service)

router.post('/', JwtHelper.middleware(), generateSchema, controller.generate)
router.put('/:id', JwtHelper.middleware(), updateSchema, controller.updateProtected)
router.get('/', JwtHelper.middleware(), controller.getAllByUser)
router.get('/:id', JwtHelper.middleware(), controller.getByIdProtected)
router.delete('/:id', JwtHelper.middleware(),controller.delete)

export default router