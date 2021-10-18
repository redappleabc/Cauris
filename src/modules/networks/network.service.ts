import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'

class NetworkService extends Service {
  constructor(model: Model<any> = db.Network) {
    super(model)
  }
}

export default NetworkService