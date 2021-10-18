import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'
import { EthereumWallet } from '@servichain/helpers/hdwallets/EthereumWallet'
import { HDWallet } from '@servichain/helpers/hdwallets/HDWallet'
import { ErrorResponse } from '@servichain/helpers/responses/ErrorResponse'
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