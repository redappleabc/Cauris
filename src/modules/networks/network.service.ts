import db from '@servichain/helpers/MongooseClient'
import { Service } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class NetworkService extends Service {
  constructor(model: Model<any> = db.Network) {
    super(model)
  }
}