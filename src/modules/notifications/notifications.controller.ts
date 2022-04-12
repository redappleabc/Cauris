import { ServiceProtected } from '@servichain/helpers/services'
import { NotificationsService } from '@servichain/modules/notifications'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers'

export class NotificationsController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
  }
}