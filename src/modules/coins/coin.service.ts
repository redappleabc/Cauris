import db from '@servichain/helpers/MongooseClient'
import { Service } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class CoinService extends Service {
  constructor(model: Model<any> = db.Coin) {
    super(model)
  }
}