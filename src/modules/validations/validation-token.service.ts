import db from '@servichain/helpers/MongooseClient'
import { Service } from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'

export class ValidationService extends Service {
  constructor(model: Model<any> = db.ValidationToken) {
    super(model)
  }
}