import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'
import { IRPC } from '@servichain/interfaces/IRPC'
import { EthersRPC } from '@servichain/helpers/rpcs/EthersRPC'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'

class TransactionService extends Service {
  constructor(model: Model<any> = db.Transaction) {
    super(model)
    this.send = this.send.bind(this)
  }

  public async send(userId: string, coinId: string, networkId: string, from: string, to: string, value: number) {
    const coin = await db.Coin.findById(coinId)
    const network = await db.Network.findById(networkId)
    const account = await db.Account.findOne({address: from}).populate('wallet')
    if (!account)
      throw new BaseError(EHttpStatusCode.NotFound, "Account not found", true)
    else if (account && account.wallet.user != userId)
      throw new BaseError(EHttpStatusCode.Unauthorized, "Invalid access to this account", true)
    const RPCHelper: IRPC = new EthersRPC(network.url, network.chainId, account)
    const tx = await RPCHelper.sendTransaction(to, value, coin.contractAddress)
    return super.insert({
      owner: userId,
      coin,
      fromAddress: from,
      toAddress: to,
      value,
      transactionHash: tx
    })
  }
}

export default TransactionService