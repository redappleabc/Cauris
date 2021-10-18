import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets/HDWallet'
import { EthereumWallet } from '@servichain/helpers/hdwallets/EthereumWallet'

class AccountService extends Service {
  constructor(model: Model<any> = db.Account) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, coinIndex: number, accountIndex: number = 0, change: number = 0, addressIndex: number = 0) {
    const userWallet = await db.Wallet.findOne({user: userId})
    const coin = await db.Coin.findOne({coinIndex})
    const wallet: HDWallet = new EthereumWallet(userWallet.mnemonic)
    const newAccount = wallet.generateKeyPair(coinIndex, accountIndex, change, addressIndex)
    return super.insert({
      wallet: userWallet,
      coin,
      accountIndex,
      change,
      addressIndex, ...newAccount
    })
  }

  //getAllCoins
  //getCoin
}

export default AccountService