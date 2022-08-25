import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '@servichain/helpers/BaseError'
import {db} from '@servichain/helpers/MongooseSingleton'
import { ValidResponse } from '@servichain/helpers/responses'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class PaymentsService extends ServiceProtected {
  constructor(model: Model<any> = db.Payment) {
    super(model)
  }
}