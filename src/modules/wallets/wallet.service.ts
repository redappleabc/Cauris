import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'
import { EthereumWallet } from '../../helpers/WalletHelpers/EthereumWallet'
import { HDWallet } from '../../helpers/WalletHelpers/HDWallet'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'
import walletModel from './wallet.model'

class WalletService extends Service {
  constructor(model: Model<any> = db.Wallet) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, network: string, userMnemonic: string = null) {
    const wallet: HDWallet = new EthereumWallet(userMnemonic)
    const {mnemonic, seed} = wallet.getWallet()
    return super.insert({
      user: userId,
      mnemonic,
      seed
    })
  }
}

export default WalletService