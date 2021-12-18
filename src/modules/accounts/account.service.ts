import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets/HDWallet'
import { EthereumWallet } from '@servichain/helpers/hdwallets/EthereumWallet'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { IAccount, INetwork, IRPC } from '@servichain/interfaces'
import { ICoin } from '@servichain/interfaces/ICoin'
import { IWallet } from '@servichain/interfaces/IWallet'
import { ValidResponse } from '@servichain/helpers/responses'
import { EthersRPC } from '@servichain/helpers/rpcs'

const AccountDetailed = {
  vituals: true,
  versionKey: false,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  }
}

export class AccountService extends ServiceProtected {
  constructor(model: Model<any> = db.Account) {
    super(model)
    this.generate = this.generate.bind(this)
    this.generateOne = this.generateOne.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
  }

  public async getAllByUser(query: any, userId: string) {
    try {
      query['wallet.user'] = userId
      query['populate'] = 'subscribedTo'
      let responseHandler = await super.getAll(query)
      let accounts: any = responseHandler.getBody()['items']
      for (let i = 0; i < accounts.length; i++) {
        accounts[i] = accounts[i].toObject(AccountDetailed)
        accounts[i] = await this.fetchCoins(accounts[i])
        delete accounts[i].privateKey
      }
      return responseHandler
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  public async updateProtected(id: string, userId: string, data: IAccount) {
    try {
      let itemCheck = await this.model.find({_id: id, 'wallet.user': userId})
      if (!itemCheck)
        throw new BaseError(EHttpStatusCode.Unauthorized, "You do not have access to this resource")
      if (!await this.checkCoinIds((data.subscribedTo as string[])))
        throw new BaseError(EHttpStatusCode.NotFound, "Specified coin index not found")
      return super.update(id, data)
    } catch(err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
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

  public async generateOne(wallet: string, hdWallet: HDWallet, {coinIndex, accountIndex = 0, change = 0, addressIndex = 0, subscribedTo}: IAccount): Promise<IAccount> {
    try {
      const coinItem: ICoin = await db.Coin.findOne({coinIndex: coinIndex})
      if (!coinItem)
        return null
      const keyPair = hdWallet.generateKeyPair(coinIndex, accountIndex, change, addressIndex)
      if (subscribedTo && await this.checkCoinIds((subscribedTo as string[])) === false) {
        throw new BaseError(EHttpStatusCode.NotFound, "Could not find corresponding coin ID")
      } else if (!subscribedTo)
        subscribedTo = await this.defaultSubscription(coinIndex)
      const newAccount: IAccount = {
        wallet,
        coinIndex,
        accountIndex,
        change,
        addressIndex,
        subscribedTo,
        ...keyPair
      }
      return this.model.create(newAccount)
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  private async checkCoinIds(coinArray: string[]) {
    for (let i = 0; i < coinArray.length; i++) {
      let count = await db.Coin.countDocuments({_id: coinArray[i]})
      if (count === 0)
        return false
    }
    return true
  }

  private async defaultSubscription(coinIndex) {
    const defaultCryptos = await db.Coin.find({contractAddress: {$exists: false}, coinIndex})
    return defaultCryptos.map(item => item._id)
  }

  public async fetchCoins(account: any) {
    try {
      for (let i = 0; i < account.subscribedTo.length; i++) {
        let coinID: string = (account.subscribedTo[i]['id'] as string)
        account.subscribedTo[i] = account.subscribedTo[i]
        account.subscribedTo[i]['balance'] = await this.getBalance(coinID, account)
        console.log(account.subscribedTo[i]['balance'])
      }
      return account
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  private async getBalance(coinID: string, account: IAccount) {
    const coin: ICoin = await db.Coin.findOne({_id: coinID}).populate('network')
    const network: INetwork = coin.network as INetwork
    const RPCHelper: IRPC = new EthersRPC(network.url, network.chainId, account, network.configKey)
    const balance = (await RPCHelper.getBalance(coin.contractAddress)).toString()
    return balance
  }

  private linkReverser(array: ICoin[]) {
    let reversedObj = {}
    for (let i = 0; i < array.length; i++) {
      const key: string = (array[i].network as string)
      delete array[i].network
      if ((`${key}` in reversedObj))
        reversedObj[`${key}`].push(array[i])
      else
        reversedObj[`${key}`] = [array[i]]
    }
    return reversedObj
  }
}