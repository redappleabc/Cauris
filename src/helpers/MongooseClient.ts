import { Model } from 'mongoose'
import User from '@servichain/modules/users/user.model'
import RefreshToken from '@servichain/modules/refreshs/refresh-token.model'
import ValidationToken from '@servichain/modules/validations/validation-token.model'
import Wallet from '@servichain/modules/wallets/wallet.model'
import Account from '@servichain/modules/accounts/account.model'
import Transaction from '@servichain/modules/transactions/transaction.model'
import Network from '@servichain/modules/networks/network.model'
import Coin from '@servichain/modules/coins/coin.model'
import config from 'config'

const mongoose = require('mongoose')
const mongoDB: string = config.get('mongoDB')

class MongooseClient {
  User: Model<any> = User
  RefreshToken: Model<any> = RefreshToken
  ValidationToken: Model<any> = ValidationToken
  Wallet: Model<any> = Wallet
  Account: Model<any> = Account
  Transaction: Model<any> = Transaction
  Network: Model<any> = Network
  Coin: Model<any> = Coin

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