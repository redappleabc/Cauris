import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets/HDWallet'
import { EthereumWallet } from '@servichain/helpers/hdwallets/EthereumWallet'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'

export class AccountService extends ServiceProtected {
  constructor(model: Model<any> = db.Account) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, coinIndex: number, accountIndex: number = 0, change: number = 0, addressIndex: number = 0) {
    try {
      const userWallet = await db.Wallet.findOne({user: userId})
      if (!userWallet)
        throw new BaseError(EHttpStatusCode.Forbidden, "You cannot generate an account without owning a wallet")
      const coin = await db.Coin.findOne({coinIndex})
      if (!coin)
        throw new BaseError(EHttpStatusCode.NotFound, "Specified coin index not found")
      const wallet: HDWallet = new EthereumWallet(userWallet.mnemonic)
      const newAccount = wallet.generateKeyPair(coinIndex, accountIndex, change, addressIndex)
      return super.insert({
        wallet: userWallet,
        coin,
        accountIndex,
        change,
        addressIndex, ...newAccount
      })
    } catch (err) {
      throw new BaseError(err.status, err.message)
    }
  }

  //getTotalBalance
  //getBalance
}