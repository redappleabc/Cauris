import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets'

export class WalletService extends ServiceProtected {
  constructor(model: Model<any> = db.Wallet) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, userMnemonic: string = null, name: string = null) {
    const wallet: HDWallet = new HDWallet(userMnemonic)
    const {mnemonic, seed} = wallet.getWallet()
    return super.insert({
      user: userId,
      mnemonic,
      seed,
      name
    })
  }
}