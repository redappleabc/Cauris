import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'

class NetworkService extends Service {
  constructor(model: Model<any> = db.Network) {
    super(model)
  }
}

export default NetworkService