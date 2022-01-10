import db from "@servichain/helpers/MongooseClient";
import { ServiceProtected } from "@servichain/helpers/services";
import { Model, Types } from "mongoose";
import { HDWallet } from "@servichain/helpers/hdwallets/HDWallet";
import { EthereumWallet } from "@servichain/helpers/hdwallets/EthereumWallet";
import { BaseError } from "@servichain/helpers/BaseError";
import { EHttpStatusCode } from "@servichain/enums";
import {
  IAccount,
  INetwork,
  IResponseHandler,
  IRPC,
} from "@servichain/interfaces";
import { ICoin } from "@servichain/interfaces/ICoin";
import { IWallet } from "@servichain/interfaces/IWallet";
import { ValidResponse } from "@servichain/helpers/responses";
import { EthersRPC } from "@servichain/helpers/rpcs";
import { utils } from "ethers";
const mongoose = require("mongoose");

const AccountDetailed = {
  vituals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
};

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

export class AccountService extends ServiceProtected {
  constructor(model: Model<any> = db.Account) {
    super(model);
    this.generate = this.generate.bind(this);
    this.generateOne = this.generateOne.bind(this);
    this.getAllByUser = this.getAllByUser.bind(this);
  }

  public async getAllAggregated(query: any): Promise<IResponseHandler> {
    let { skip, limit, populate } = query;

    skip = skip ? Number(skip) : 0;
    limit = limit ? Number(limit) : 25;
    populate = populate ? populate : "";

    delete query.skip;
    delete query.limit;

    if (query._id) {
      try {
        query._id = new mongoose.mongo.ObjectId(query._id);
      } catch (error) {
        throw new BaseError(
          EHttpStatusCode.BadRequest,
          "Invalid query ID",
          true
        );
      }
    }

    try {
      const aggregationPipeline = [
        { $match: {} },
        {
          $lookup: {
            from: "wallets",
            localField: "wallet",
            foreignField: "_id",
            as: "wallet",
          },
        },
        { $unwind: "$wallet" },
        {
          $unwind: {
            path: "$subscribedTo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "coins",
            localField: "subscribedTo",
            foreignField: "_id",
            as: "subscribedTo",
          },
        },
        { $unwind: "$subscribedTo" },
        {
          $lookup: {
            from: "networks",
            localField: "subscribedTo.network",
            foreignField: "_id",
            as: "network_infos",
          },
        },
        { $unwind: "$network_infos" },
        // {
        //   $group: { accounts: { $push: "$$ROOT" },_id: { network_info : "$network_infos"} },
        // },
        {
          $addFields: {
            networkName: "$network_infos.name",
            networkId: "$_id._id",
            networkConfig: "$_id.configKey",
            networkChainId: "$_id.ChainId",
            networkUrl: "$_id.url",
          },
        },
      ];
      let accountsByNetwork: Document[] = await this.model
        .aggregate(aggregationPipeline)
        // @ts-ignore: Unreachable code error
        .group({ _id: "$network_infos", accounts: { $push: "$$ROOT" } });
      let total: number = await this.model.count(query);
      if (!accountsByNetwork)
        throw new BaseError(EHttpStatusCode.NotFound, "Empty list.", true);
      return new ValidResponse(EHttpStatusCode.OK, {
        items: accountsByNetwork,
        total,
      });
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true);
    }
  }

  public async getAllByUser(query: any, userId: string) {
    try {
      query["populate"] = "subscribedTo wallet";
      let responseHandler = await this.getAllAggregated(query);
      let accountsnetworks: any = responseHandler.getBody()["items"];
      let account_list = [];

      for (let i = 0; i < accountsnetworks.length; i++) {
        const netAccount = accountsnetworks[i];
        let network = netAccount._id; //network object
        const RPCHelper: IRPC = new EthersRPC(
          network.url,
          network.chainId,
          network.configKey
        );
        let accounts = netAccount.accounts;

        accounts = accounts.filter((item) => item.wallet.user == userId);
        for (let i = 0; i < accounts.length; i++) {
          let account = accounts[i];
          let N_account = { ...account, id: account._id };
          delete N_account._id;
          N_account = await this.fetchCoins(N_account, RPCHelper);
          delete N_account.privateKey;
          N_account.wallet = N_account.wallet.id;
          accounts[i] = N_account;
        }

        account_list = [...account_list, ...accounts];
      }
      responseHandler.message.items = account_list;
      responseHandler.message.total = account_list.length;
      return responseHandler;
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  public async updateProtected(id: string, userId: string, data: IAccount) {
    try {
      let itemCheck = await this.model.find({ _id: id, "wallet.user": userId });
      if (!itemCheck)
        throw new BaseError(
          EHttpStatusCode.Unauthorized,
          "You do not have access to this resource"
        );
      if (!(await this.checkCoinIds(data.subscribedTo as string[])))
        throw new BaseError(
          EHttpStatusCode.NotFound,
          "Specified coin index not found"
        );
      return super.update(id, data);
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  public async generate(
    userId: string,
    walletId: string,
    accountsArray: [IAccount] | IAccount
  ) {
    try {
      const userWallet: IWallet = await db.Wallet.findOne({
        user: userId,
        _id: walletId,
      });
      if (!userWallet)
        throw new BaseError(
          EHttpStatusCode.Forbidden,
          "You cannot generate an account without owning a wallet"
        );
      const hdWallet: HDWallet = new EthereumWallet(userWallet.mnemonic);

      if (accountsArray instanceof Array === false) {
        let responseItem: IAccount = await this.generateOne(
          walletId,
          hdWallet,
          accountsArray as IAccount
        );
        if (!responseItem)
          throw new BaseError(
            EHttpStatusCode.NotFound,
            "Specified coin index not found"
          );
        return new ValidResponse(EHttpStatusCode.Created, responseItem);
      } else {
        let responseArray: Array<IAccount> = [];
        for (let i = 0; i < (accountsArray as [IAccount]).length; i++) {
          let item = (accountsArray as [IAccount])[i];
          let accountResponse = await this.generateOne(
            walletId,
            hdWallet,
            item
          );
          if (accountResponse) responseArray.push(accountResponse);
        }
        if (!responseArray.length)
          throw new BaseError(
            EHttpStatusCode.NotFound,
            "Specified coin index not found"
          );
        return new ValidResponse(EHttpStatusCode.Created, responseArray);
      }
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  public async generateOne(
    wallet: string,
    hdWallet: HDWallet,
    {
      coinIndex,
      accountIndex = 0,
      change = 0,
      addressIndex = 0,
      subscribedTo,
    }: IAccount
  ): Promise<IAccount> {
    try {
      const coinItem: ICoin = await db.Coin.findOne({ coinIndex: coinIndex });
      if (!coinItem) return null;
      const keyPair = hdWallet.generateKeyPair(
        coinIndex,
        accountIndex,
        change,
        addressIndex
      );
      if (
        subscribedTo &&
        (await this.checkCoinIds(subscribedTo as string[])) === false
      ) {
        throw new BaseError(
          EHttpStatusCode.NotFound,
          "Could not find corresponding coin ID"
        );
      } else if (!subscribedTo)
        subscribedTo = await this.defaultSubscription(coinIndex);
      const newAccount: IAccount = {
        wallet,
        coinIndex,
        accountIndex,
        change,
        addressIndex,
        subscribedTo,
        ...keyPair,
      };
      return this.model.create(newAccount);
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  private async checkCoinIds(coinArray: string[]) {
    for (let i = 0; i < coinArray.length; i++) {
      let count = await db.Coin.countDocuments({ _id: coinArray[i] });
      if (count === 0) return false;
    }
    return true;
  }

  private async defaultSubscription(coinIndex) {
    const defaultCryptos = await db.Coin.find({
      contractAddress: { $exists: false },
      coinIndex,
    });
    return defaultCryptos.map((item) => item._id);
  }

  public async fetchCoins(account: any, RPCHelper) {
    try {
      let coinID: string = account.subscribedTo["_id"] as string;
      account.subscribedTo["balance"] = await this.getBalance(
        coinID,
        account,
        RPCHelper
      );
      return account;
    } catch (err) {
      if (err instanceof BaseError) throw err;
      throw new BaseError(EHttpStatusCode.InternalServerError, err);
    }
  }

  private async getBalance(coinID: string, account: IAccount, RPCHelper) {
    const coin: ICoin = await db.Coin.findOne({ _id: coinID }).populate(
      "network"
    );
    RPCHelper.setWallet(account);
    const balance = (
      await RPCHelper.getBalance(coin.contractAddress)
    ).toString();
    return utils.formatUnits(balance, coin.decimals);
  }

  private linkReverser(array: ICoin[]) {
    let reversedObj = {};
    for (let i = 0; i < array.length; i++) {
      const key: string = array[i].network as string;
      delete array[i].network;
      if (`${key}` in reversedObj) reversedObj[`${key}`].push(array[i]);
      else reversedObj[`${key}`] = [array[i]];
    }
    return reversedObj;
  }
}
