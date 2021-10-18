import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'

class CoinService extends Service {
  constructor(model: Model<any> = db.Coin) {
    super(model)
  }
}

export default new CoinService(db.Coin)