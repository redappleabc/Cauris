import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'

class CoinService extends Service {
  constructor(model: Model<any> = db.Coin) {
    super(model)
  }
}

export default new CoinService(db.Coin)