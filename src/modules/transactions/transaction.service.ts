import { db } from "@servichain/helpers/MongooseSingleton";
import { rpcs } from '@servichain/helpers/RPCSingleton';
import { ServiceProtected } from "@servichain/helpers/services";
import { isValidObjectId, Model } from "mongoose";
import {
  IAccount,
  ICoin,
  INetwork,
  IResponseHandler,
  IRPC,
  IUser,
} from "@servichain/interfaces";
import { BaseError } from "@servichain/helpers/BaseError";
import { EHttpStatusCode, EUserRole } from "@servichain/enums";
import { IWallet } from "@servichain/interfaces/IWallet";
import { utils } from "ethers";
import { ValidResponse } from "@servichain/helpers/responses";
import { BitcoinRPC, EthersRPC } from "@servichain/helpers/rpcs";
import { OptimalRate } from "paraswap-core";
import { ITxBody } from "@servichain/interfaces/ITxBody";
import { AESHelper } from "@servichain/helpers/AESHelper";
import { EError } from "@servichain/enums/EError";
const mongoose = require("mongoose");

const CRYPTO_DECIMALS = "18"

export class TransactionService extends ServiceProtected {
  constructor(model: Model<any> = db.Transaction) {
    super(model, "[Transaction Service]");
    this.send = this.send.bind(this);
    this.getAllByCoin = this.getAllByCoin.bind(this);
    this.estimateTransfer = this.estimateTransfer.bind(this)
    this.estimateSwap = this.estimateSwap.bind(this)
    this.approveSwap = this.approveSwap.bind(this)
    this.sendSwap = this.sendSwap.bind(this)
    this.getBtcUnspentTransactions = this.getBtcUnspentTransactions.bind(this)
  }

  private async getCoinById(coinId: string) {
    if (isValidObjectId(coinId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
    const coin: ICoin = await db.Coin.findOne({ _id: coinId }).populate("network")
    if (!coin)
      throw new BaseError(EHttpStatusCode.NotFound,EError.MongoEmpty);
    return coin
  }

  private async getNetworkById(networkId: string) {
    if (isValidObjectId(networkId) == false) {
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
    }
    const network: INetwork = await db.Network.findOne({ _id: networkId })
    if (!network) {
      throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
    }
    return network
  }

  private async getNetworkByChainId(chainId: number) {
    const network: INetwork = await db.Network.findOne({ chainId: chainId })
    if (!network) {
      throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
    }
    return network
  }

  private async retrieveRpcByCoin(coinId: string) {
    if (isValidObjectId(coinId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
    const coin: ICoin = await this.getCoinById(coinId)
    if (!coin)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoEmpty)
    const network: INetwork = coin.network as INetwork;
    const RPCHelper: IRPC = rpcs.getInstance(network.name)
    if (!RPCHelper)
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.ManagerRPC)
    return { coin, network, RPCHelper }
  }

  private async retrieveRpcByNetwork(networkId: string) {
    const network: INetwork = await this.getNetworkById(networkId)
    const RPCHelper: IRPC = rpcs.getInstance(network.name)
    if (!RPCHelper)
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.ManagerRPC)
    return { network, RPCHelper }
  }

  private async retrieveRpcByChainId(chainId: number) {
    const network: INetwork = await this.getNetworkByChainId(chainId)
    const RPCHelper: IRPC = rpcs.getInstance(network.name)
    if (!RPCHelper)
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.ManagerRPC)
    return { network, RPCHelper }
  }

  private async retrieveAccountByAddress(userId: string, address: string) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
    const account: IAccount = await db.Account.findOne({
      address,
    }).populate("wallet");
    if (!account)
      throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
    else if (account && (account.wallet as IWallet).user != userId)
      throw new BaseError(EHttpStatusCode.Unauthorized, EError.ReqUsurpation);
    return account
  }

  private async getAllbyQuery(userId: string, query: any) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
    const user: IUser = await db.User.findOne({
      id: userId
    })
    if (!user || user.role != EUserRole.Admin)
      throw new BaseError(
        EHttpStatusCode.BadRequest, EError.ReqUsurpation)
    let query_;
    const { coin = null, address = null } = query;
    let and = [];
    if (!!address) {
      await this.retrieveAccountByAddress(userId, address)
      query_ = {
        $or: [{ toAddress: address }, { fromAddress: address }],
      };
      and.push(query_);
    }
    if (!!coin) {
      and.push({ coin: mongoose.Types.ObjectId(coin) });
    }
    query_ = (and.length) ? { $and: and } : query
    return super.getAll(query_);
  }

  public async getAllByCoin(userId: string, query: any) {
    try {
      const { coinId = null, address = null, page = 1 } = query
      if (!!coinId && !!address) {
        if (isValidObjectId(userId) === false)
          throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
        const { coin, RPCHelper } = await this.retrieveRpcByCoin(coinId)
        const account = await this.retrieveAccountByAddress(userId, address)
        const AES = new AESHelper(userId)
        await AES.initialize()
  
        account.privateKey = AES.decrypt(account.privateKey)
        RPCHelper.setWallet(account)
        const history = await RPCHelper.getHistory(address, coin, page)
        return new ValidResponse(EHttpStatusCode.OK, history)
      } else {
        return await this.getAllbyQuery(userId, query)
      }
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name)
    }
  } 

  public async getBtcUnspentTransactions(userId: string, query: any) {
    try {
      const { coinId = null, address = null } = query
      if (!!coinId && !!address) {
        if (isValidObjectId(userId) === false)
          throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
        const { coin, RPCHelper } = await this.retrieveRpcByCoin(coinId)
        if ((coin.network as INetwork).type !== 1){
          throw new BaseError(EHttpStatusCode.BadRequest, EError.BCNotSupported)
        }
        const account = await this.retrieveAccountByAddress(userId, address)
        const AES = new AESHelper(userId)
        await AES.initialize()
  
        account.privateKey = AES.decrypt(account.privateKey)
        RPCHelper.setWallet(account)
        const history = await (RPCHelper as BitcoinRPC).getUnspentTransactions()
        return new ValidResponse(EHttpStatusCode.OK, history)
      } else {
        throw new BaseError(EHttpStatusCode.BadRequest, EError.ReqIncompleteQuery + "'address' & 'coinId'" + this.name)
      }
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async estimateSwap(userId: string, srcCoinId: string, destCoinId: string, from: string, value: string) {
    try {
      if (srcCoinId === destCoinId)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.BCSwapSame)
      if (isValidObjectId(userId) === false || isValidObjectId(srcCoinId) === false || isValidObjectId(destCoinId) === false) {
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      }
      const { coin, RPCHelper } = await this.retrieveRpcByCoin(srcCoinId)
      const coinDest = await this.getCoinById(destCoinId)
      const account = await this.retrieveAccountByAddress(userId, from)
      const AES = new AESHelper(userId)
      await AES.initialize()
      account.privateKey = AES.decrypt(account.privateKey)
      RPCHelper.setWallet(account)
      const priceRoute = await (RPCHelper as EthersRPC).getSwapPrice(coin, coinDest, value)
      const isAllowed = await (RPCHelper as EthersRPC).isAllowanced(priceRoute?.tokenTransferProxy, priceRoute?.srcAmount as string, coin.contractAddress ? priceRoute?.srcToken : null)
      if (isAllowed) {
        const txSwap = await (RPCHelper as EthersRPC).buidSwapTx(priceRoute)
        const gasFees = (!!txSwap.gasPrice && !!txSwap.gasLimit) ? 
          (RPCHelper as EthersRPC).calculateGasFees(txSwap.gasPrice, txSwap.gasLimit) :
          await (RPCHelper as EthersRPC).estimate({ to: txSwap.to, value: txSwap.value, data: txSwap.data }, coin)
        return new ValidResponse(EHttpStatusCode.OK, { priceRoute, txSwap, fees: utils.formatUnits(gasFees, CRYPTO_DECIMALS), needApproval: false })
      } else {
        const gasFees = await (RPCHelper as EthersRPC).estimate({ to: priceRoute.tokenTransferProxy, value: priceRoute.srcAmount }, coin, "approve")
        return new ValidResponse(EHttpStatusCode.OK, { priceRoute, txSwap: null, fees: utils.formatUnits(gasFees, CRYPTO_DECIMALS), needApproval: true })
      }
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async approveSwap(userId: string, coinId: string, from: string, priceRoute: OptimalRate) {
    try {
    const { RPCHelper } = await this.retrieveRpcByChainId(priceRoute.network)
    let coin = await this.getCoinById(coinId)
    const account = await this.retrieveAccountByAddress(userId, from)
    const AES = new AESHelper(userId)
    await AES.initialize()
    account.privateKey = AES.decrypt(account.privateKey)
    RPCHelper.setWallet(account)
    const txAllowed = await (RPCHelper as EthersRPC).approve(priceRoute.tokenTransferProxy, priceRoute.srcAmount, coin.contractAddress ? priceRoute.srcToken : null)
    const txSwap = await (RPCHelper as EthersRPC).buidSwapTx(priceRoute)
    if (coin.contractAddress) {
      coin.contractAddress = priceRoute.srcToken;
    }
    const gasFees = (!!txSwap.gasPrice && !!txSwap.gasLimit) ? 
      (RPCHelper as EthersRPC).calculateGasFees(txSwap.gasPrice, txSwap.gasLimit) :
      await (RPCHelper as EthersRPC).estimate({ to: txSwap.to, value: txSwap.value, data: txSwap.data }, coin)
    return new ValidResponse(EHttpStatusCode.OK, { txAllowed, txSwap, fees: utils.formatUnits(gasFees, CRYPTO_DECIMALS) })
    }
    catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async sendSwap(userId: string, coinId: string, from: string, txSwap: ITxBody) {
    try {
      const { RPCHelper } = await this.retrieveRpcByChainId(txSwap.chainId)
      const coin = await this.getCoinById(coinId)
      const account = await this.retrieveAccountByAddress(userId, from)
      const AES = new AESHelper(userId)
      await AES.initialize()
      account.privateKey = AES.decrypt(account.privateKey)
      RPCHelper.setWallet(account)
      const hash = await (RPCHelper as EthersRPC).swap(coin, txSwap)
      return super.insert({
        user: userId,
        coin,
        from,
        to: txSwap.to,
        value: txSwap.value,
        hash
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async estimateTransfer(userId: string, coinId: string, from: string, to: string, value: string) {
    try {
      if (isValidObjectId(userId) === false || isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      const { coin, RPCHelper } = await this.retrieveRpcByCoin(coinId)
      const account = await this.retrieveAccountByAddress(userId, from)
      const AES = new AESHelper(userId)
      await AES.initialize()
  
      account.privateKey = AES.decrypt(account.privateKey)
      RPCHelper.setWallet(account)
      const gasFees = await RPCHelper.estimate({ to, value }, coin)
      return new ValidResponse(EHttpStatusCode.OK, { fees: utils.formatUnits(gasFees, CRYPTO_DECIMALS) })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  private async retrieveCrypto(network: INetwork | string) {
    const crypto = await db.Coin.findOne({network, contractAddress: {$exists: false}})
    if (!crypto)
      throw new BaseError(EHttpStatusCode.BadRequest, "The network does not have any crypto assigned")
    return crypto
  }

  public async send(userId: string, coinId: string, from: string, to: string, value: string, unSpentTransactions: string[]) {
    try {
      if (isValidObjectId(userId) === false || isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      const { coin, RPCHelper } = await this.retrieveRpcByCoin(coinId)
      const account = await this.retrieveAccountByAddress(userId, from)
      const AES = new AESHelper(userId)
      await AES.initialize()
      account.privateKey = AES.decrypt(account.privateKey)
      RPCHelper.setWallet(account);
      const hash = await RPCHelper.transfer({ to, value }, coin, unSpentTransactions);
      return super.insert({
        user: userId,
        coin,
        from,
        to,
        value,
        hash
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async claimFee(userId: string, coinId: string) {
    try {
      if (isValidObjectId(userId) === false || isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      const { coin, RPCHelper } = await this.retrieveRpcByCoin(coinId)
      const account = await this.retrieveAccountByAddress(userId, "0x7E2935FD37b5CBd15FF32a076ee7cE3bf3EC1745")
      const AES = new AESHelper(userId)
      await AES.initialize()
      account.privateKey = AES.decrypt(account.privateKey)
      RPCHelper.setWallet(account);
      const claimAmount = await (RPCHelper as EthersRPC).claimFeeEstimate(coin);
      const hash = await (RPCHelper as EthersRPC).claimFee(coin);
      return super.insert({
        user: userId,
        coin,
        from:"0x7E2935FD37b5CBd15FF32a076ee7cE3bf3EC1745" ,
        to:"paraswap fee claimer" ,
        value: utils.formatUnits(claimAmount, coin.decimals),
        hash
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }


  public async claimFeeEstimate(userId: string, coinId: string) {
    try {
      if (isValidObjectId(userId) === false || isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      const { coin, RPCHelper } = await this.retrieveRpcByCoin(coinId)
      const account = await this.retrieveAccountByAddress(userId, "0x7E2935FD37b5CBd15FF32a076ee7cE3bf3EC1745")
      const AES = new AESHelper(userId)
      await AES.initialize()
      account.privateKey = AES.decrypt(account.privateKey)
      RPCHelper.setWallet(account);
      const claimAmount = await (RPCHelper as EthersRPC).claimFeeEstimate(coin);
      return new ValidResponse(EHttpStatusCode.OK, { claimAmount: utils.formatUnits(claimAmount, coin.decimals) })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }
}
