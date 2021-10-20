import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { HDWallet, EthereumWallet } from '@servichain/helpers/hdwallets'

export class WalletService extends ServiceProtected {
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