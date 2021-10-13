import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'
import { HDWallet } from '../../helpers/WalletHelpers/HDWallet'
import { EthereumWallet } from '../../helpers/WalletHelpers/EthereumWallet'

class AccountService extends Service {
  constructor(model: Model<any> = db.Account) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, coinIndex: number, accountIndex: number = 0, change: number = 0, addressIndex: number = 0) {
    try {
      const userWallet = await db.Wallet.findOne({user: userId})
      const coin = await db.Coin.findOne({coinIndex})
      const wallet: HDWallet = new EthereumWallet(userWallet.mnemonic)
      const newAccount = wallet.generateKeyPair(coinIndex, accountIndex, change, addressIndex)
      return super.insert({
        wallet: userWallet,
        coin,
        accountIndex,
        change,
        addressIndex, ...newAccount})
    } catch (err) {
      return new ErrorResponse(500, err)
    }
  }

  //getAllCoins
  //getCoin
}

export default AccountService