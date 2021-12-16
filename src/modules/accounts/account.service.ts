import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets/HDWallet'
import { EthereumWallet } from '@servichain/helpers/hdwallets/EthereumWallet'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { IAccount } from '@servichain/interfaces'
import { ICoin } from '@servichain/interfaces/ICoin'
import { IWallet } from '@servichain/interfaces/IWallet'
import { ValidResponse } from '@servichain/helpers/responses'

export class AccountService extends ServiceProtected {
  constructor(model: Model<any> = db.Account) {
    super(model)
    this.generate = this.generate.bind(this)
    this.generateOne = this.generateOne.bind(this)
  }

  public async generate(userId: string, walletId: string, accountsArray: [IAccount] | IAccount) {
    try {
      const userWallet: IWallet = await db.Wallet.findOne({user: userId, _id: walletId})
      if (!userWallet)
        throw new BaseError(EHttpStatusCode.Forbidden, "You cannot generate an account without owning a wallet")
      const hdWallet: HDWallet = new EthereumWallet(userWallet.mnemonic)

      if ((accountsArray instanceof Array) === false) {
        let responseItem: IAccount = await this.generateOne(walletId, hdWallet, (accountsArray as IAccount))
        if (!responseItem)
          throw new BaseError(EHttpStatusCode.NotFound, "Specified coin index not found")
        return new ValidResponse(EHttpStatusCode.Created, responseItem)
      } else {
        let responseArray: Array<IAccount> = [];
        for (let i = 0; i < (accountsArray as [IAccount]).length; i++) {
          let item = (accountsArray as [IAccount])[i]
          let accountResponse = await this.generateOne(walletId, hdWallet, item)
          if (accountResponse)
            responseArray.push(accountResponse)
        }
        if (!responseArray.length)
          throw new BaseError(EHttpStatusCode.NotFound, "Specified coin index not found")
        return new ValidResponse(EHttpStatusCode.Created, responseArray)
      }
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  public async generateOne(wallet: string, hdWallet: HDWallet, {coinIndex, accountIndex = 0, change = 0, addressIndex = 0}: IAccount): Promise<IAccount> {
    try {
      const coinItem: ICoin = await db.Coin.findOne({coinIndex: coinIndex})
      if (!coinItem)
        return null
      const keyPair = hdWallet.generateKeyPair(coinIndex, accountIndex, change, addressIndex)
      const newAccount: IAccount = {
        wallet,
        coinIndex,
        accountIndex,
        change,
        addressIndex,
        ...keyPair
      }
      return this.model.create(newAccount)
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  //getBalance
}