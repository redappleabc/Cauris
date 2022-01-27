import {db} from "@servichain/helpers/MongooseSingleton";
import {rpcs} from '@servichain/helpers/RPCSingleton';
import { ServiceProtected } from "@servichain/helpers/services";
import { Model } from "mongoose";
import {
  IAccount,
  ICoin,
  INetwork,
  IResponseHandler,
  IRPC,
} from "@servichain/interfaces";
import { BaseError } from "@servichain/helpers/BaseError";
import { EHttpStatusCode } from "@servichain/enums";
import { IWallet } from "@servichain/interfaces/IWallet";
import { ethers, utils } from "ethers";
import { ValidResponse } from "@servichain/helpers/responses";
const mongoose = require("mongoose");

export class TransactionService extends ServiceProtected {
  constructor(model: Model<any> = db.Transaction) {
    super(model);
    this.send = this.send.bind(this);
    this.getAllByCoin = this.getAllByCoin.bind(this);
  }

  public async getAllbyQuery(query: any) {
    let query_;
    const { coin = null, address = null } = query;
    let and = [];
    if (!!address) {
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

  public async getAllByCoin(query: any) {
    const { coinId = null, address = null, page = 1} = query
    if (!!coinId && !!address) {
      const coin: ICoin = await this.getCoinById(coinId)
      const network: INetwork = coin.network as INetwork;
      const RPCHelper: IRPC = rpcs.getInstance(network.name)

      const history = await RPCHelper.getHistory(coin.contractAddress, page)
      return new ValidResponse(EHttpStatusCode.OK, history)
    } else {
      return await this.getAllbyQuery(query)
    }
  }

  private async getCoinById(coinId: string) {
    const coin: ICoin = await db.Coin.findOne({ _id: coinId }).populate("network")
    if (!coin)
      throw new BaseError(
        EHttpStatusCode.NotFound,
        "Specified coin doesnt exist or wasnt found on the specified network"
      );
    return coin
  }

  public async getGasPrice(coinId: string, value: string) {
    const coin: ICoin = await this.getCoinById(coinId)
    const network: INetwork = coin.network as INetwork;
    const RPCHelper: IRPC = rpcs.getInstance(network.name)

    const parsedValue = utils.parseUnits(value, coin.decimals || "ethers");
    const gasPrice = await RPCHelper.getGasPrice(parsedValue)
    return new ValidResponse(EHttpStatusCode.OK, utils.formatUnits(gasPrice, coin.decimals))
  }

  public async send(
    userId: string,
    coinId: string,
    from: string,
    to: string,
    value: string
  ) {
    try {
      const coin: ICoin = await this.getCoinById(coinId)
      const network: INetwork = coin.network as INetwork;
      const account: IAccount = await db.Account.findOne({
        address: from,
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
      const parsedValue = utils.parseUnits(value, coin.decimals || "ethers");
      const RPCHelper: IRPC = rpcs.getInstance(network.name)
      RPCHelper.setWallet(account);
      const handleInsert = (d) => super.insert(d);
      const tx = await RPCHelper.sendTransaction(
        to,
        parsedValue,
        coin.contractAddress,
        handleInsert,
        {
          user: userId,
          coin,
          from,
          to,
          value,
        }
      );
      return tx;
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  public async updateProtected(id: string, userId: string, data: any) {
    try {
      console.log("trax update ", id);
      let itemCheck = await db.Transaction.find({ transactionHash: id });
      if (!itemCheck)
        throw new BaseError(
          EHttpStatusCode.Unauthorized,
          "You do not have access to this resource"
        );
      return this.update(id, data);
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  public async update(id: string, data: any): Promise<IResponseHandler> {
    try {
      let item: Document = await db.Transaction.findOneAndUpdate(
        { transactionHash: id },
        data,
        { new: true }
      );

      if (!item) {
        throw new BaseError(EHttpStatusCode.NotFound, "Trx not found.", true);
      }
      return new ValidResponse(EHttpStatusCode.Accepted, item);
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true);
    }
  }
}
