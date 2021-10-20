import { Model } from 'mongoose'
/* Not using barrels to avoid circular includes  */
import {UserModel} from '@servichain/modules/users/user.model'
import {RefreshModel} from '@servichain/modules/refreshs/refresh-token.model'
import {ValidationModel} from '@servichain/modules/validations/validation-token.model'
import {WalletModel} from '@servichain/modules/wallets/wallet.model'
import {AccountModel} from '@servichain/modules/accounts/account.model'
import {TransactionModel} from '@servichain/modules/transactions/transaction.model'
import {NetworkModel} from '@servichain/modules/networks/network.model'
import {CoinModel} from '@servichain/modules/coins/coin.model'
import config from 'config'

const mongoose = require('mongoose')
const mongoDB: string = config.get('mongoDB')

class MongooseClient {
  User: Model<any> = UserModel
  RefreshToken: Model<any> = RefreshModel
  ValidationToken: Model<any> = ValidationModel
  Wallet: Model<any> = WalletModel
  Account: Model<any> = AccountModel
  Transaction: Model<any> = TransactionModel
  Network: Model<any> = NetworkModel
  Coin: Model<any> = CoinModel

  constructor() {
    const url = process.env.MONGO_URI || mongoDB
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
    mongoose.Promise = global.Promise
    mongoose.connect(url, options)
  }

  isValidID(id: any) {
    return mongoose.Types.ObjectId.isValid(id)
  }
}

export default new MongooseClient()