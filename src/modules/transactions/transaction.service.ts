import {db} from "@servichain/helpers/MongooseSingleton";
import {rpcs} from '@servichain/helpers/RPCSingleton';
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
import { ethers, utils } from "ethers";
import { ValidResponse } from "@servichain/helpers/responses";
const mongoose = require("mongoose");

export class TransactionService extends ServiceProtected {
  constructor(model: Model<any> = db.Transaction) {
    super(model);
    this.send = this.send.bind(this);
    this.getAllByCoin = this.getAllByCoin.bind(this);
    this.estimate = this.estimate.bind(this)
  }

  private async getCoinById(coinId: string) {
    if (isValidObjectId(coinId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    const coin: ICoin = await db.Coin.findOne({ _id: coinId }).populate("network")
    if (!coin)
      throw new BaseError(
        EHttpStatusCode.NotFound,
        "Specified coin doesnt exist or wasnt found on the specified network"
      );
    return coin
  }

  private async retrieveRpcByCoin(coinId: string) {
    if (isValidObjectId(coinId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    const coin: ICoin = await this.getCoinById(coinId)
    if (!coin)
      throw new BaseError(EHttpStatusCode.BadRequest, "Could not find Coin")
    const network: INetwork = coin.network as INetwork;
    const RPCHelper: IRPC = rpcs.getInstance(network.name)
    if (!RPCHelper)
      throw new BaseError(EHttpStatusCode.InternalServerError, "Could not find RPC instance")
    return {coin, network, RPCHelper}
  }

  private async retrieveAccountByAddress(userId: string, address: string) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    const account: IAccount = await db.Account.findOne({
      address,
    }).populate("wallet");
    if (!account)
      throw new BaseError(
        EHttpStatusCode.NotFound,
        "Account not found",
        true
      );
    else if (account && (account.wallet as IWallet).user != userId)
      throw new BaseError(
        EHttpStatusCode.Unauthorized,
        "Invalid access to this account",
        true
      );
    return account
  }

  private async getAllbyQuery(userId: string, query: any) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    const user: IUser = await db.User.findOne({
      id: userId
    })
    if (!user || user.role != EUserRole.Admin)
      throw new BaseError(
        EHttpStatusCode.BadRequest,
        "Please enter query param 'address' & 'coinId'",
        true
      )
    let query_;
    const { coin = null, address = null } = query;
    let and = [];
    if (!!address) {
      await this.retrieveAccountByAddress(userId, address)
      query_ = {
        $or: [{ toAddress: address}, {fromAddress: address }],
      };
      and.push(query_);
    }
    if (!!coin) {
      and.push({ coin: mongoose.Types.ObjectId(coin) });
    }
    query_= (and.length) ? {$and:and} : query
    return super.getAll(query_);
  }

  public async getAllByCoin(userId: string, query: any) {
    const { coinId = null, address = null, page = 1} = query
    if (!!coinId && !!address) {
      if (isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
      const {coin, RPCHelper} = await this.retrieveRpcByCoin(coinId)
      const account = await this.retrieveAccountByAddress(userId, address)
      RPCHelper.setWallet(account)
      const history = await RPCHelper.getHistory(address, coin, page)
      return new ValidResponse(EHttpStatusCode.OK, history)
    } else {
      return await this.getAllbyQuery(userId, query)
    }
  }

  public async estimate(userId: string, coinId: string, from: string, to: string, value: string) {
    if (isValidObjectId(userId) === false || isValidObjectId(coinId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)

    const {coin, RPCHelper} = await this.retrieveRpcByCoin(coinId)
    const account = await this.retrieveAccountByAddress(userId, from)
    RPCHelper.setWallet(account)
    const gasFees = await RPCHelper.estimate(to, value, coin)
    return new ValidResponse(EHttpStatusCode.OK, {fees: utils.formatUnits(gasFees, "18")})
  }

  public async send(userId: string, coinId: string, from: string, to: string, value: string) {
    try {
      if (isValidObjectId(userId) === false || isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
      const {coin, RPCHelper} = await this.retrieveRpcByCoin(coinId)
      const account = await this.retrieveAccountByAddress(userId, from)
      RPCHelper.setWallet(account);
      const hash = await RPCHelper.sendTransaction(to, value, coin);
      return super.insert({
        user: userId,
        coin,
        from,
        to,
        value,
        hash
      })
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }
}
