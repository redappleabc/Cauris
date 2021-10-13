import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'

class ValidationService extends Service {
  constructor(model: Model<any> = db.ValidationToken) {
    super(model)
  }
}

export default new ValidationService(db.ValidationToken)