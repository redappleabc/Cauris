import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class ValidationService extends ServiceProtected {
  constructor(model: Model<any> = db.ValidationToken) {
    super(model)
  }
}