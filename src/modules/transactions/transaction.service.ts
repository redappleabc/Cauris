import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { IAccount, ICoin, INetwork, IRPC } from '@servichain/interfaces'
import { EthersRPC } from '@servichain/helpers/rpcs/EthersRPC'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { IWallet } from '@servichain/interfaces/IWallet'
import { utils } from 'ethers'

export class TransactionService extends ServiceProtected {
  constructor(model: Model<any> = db.Transaction) {
    super(model)
    this.send = this.send.bind(this)
  }

  public async send(userId: string, coinId: string, from: string, to: string, value: string) {
    try {
      const coin: ICoin = await db.Coin.findOne({_id: coinId}).populate('network')
      if (!coin)
        throw new BaseError(EHttpStatusCode.NotFound, "Specified coin doesnt exist or wasnt found on the specified network")
      const network: INetwork = coin.network as INetwork
      const account: IAccount = await db.Account.findOne({address: from}).populate('wallet')
      if (!account)
        throw new BaseError(EHttpStatusCode.NotFound, "Account not found", true)
      else if (account && (account.wallet as IWallet).user != userId)
        throw new BaseError(EHttpStatusCode.Unauthorized, "Invalid access to this account", true)
      const parsedValue = utils.parseUnits(value, coin.decimals || "ethers")
      const RPCHelper = new EthersRPC(network.url, network.chainId, network.configKey)
      RPCHelper.setWallet(account)
      const tx = await RPCHelper.sendTransaction(to, parsedValue, coin.contractAddress)
      return super.insert({
        user: userId,
        coin,
        fromAddress: from,
        toAddress: to,
        value: value,
        transactionHash: tx
      })
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }
}