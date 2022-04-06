import {db} from "@servichain/helpers/MongooseSingleton";
import { ServiceProtected } from "@servichain/helpers/services";
import { isValidObjectId, Model } from "mongoose";
import { HDWallet } from "@servichain/helpers/hdwallets/HDWallet";
import { EthereumWallet } from "@servichain/helpers/hdwallets/EthereumWallet";
import { BaseError } from "@servichain/helpers/BaseError";
import { EHttpStatusCode } from "@servichain/enums";
import {
  IAccount,
  IResponseHandler,
  IRPC,
} from "@servichain/interfaces";
import { ICoin } from "@servichain/interfaces/ICoin";
import { IWallet } from "@servichain/interfaces/IWallet";
import { ValidResponse } from "@servichain/helpers/responses";
import { rpcs } from "@servichain/helpers/RPCSingleton";
import { utils } from "ethers";
import { accountsAggregation, contactAggregation } from "./account.aggregation";
import sanitize from 'mongo-sanitize'
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
    this.getByCoinId = this.getByCoinId.bind(this)
  }

  private async getAllAggregated(query: any, userId: string): Promise<IResponseHandler> {
    let { skip, limit, populate, wallet=null } = query;

    skip = skip ? Number(skip) : 0;
    limit = limit ? Number(limit) : 25;
    populate = populate ? populate : "";

    delete query.skip;
    delete query.limit;
    delete query.$match

    try {
      if (isValidObjectId(userId) === false || isValidObjectId(wallet) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
      let walletExist = db.Wallet.findOne({_id: wallet, user: userId})
      if (!walletExist)
        throw new BaseError(EHttpStatusCode.BadRequest, "This wallet does not exist or does not belong to you")
      const aggregationPipeline = accountsAggregation(wallet)
      let accountsByNetwork: Document[] = await this.model
        .aggregate(aggregationPipeline)
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

  public async getByCoinId(query: any): Promise<IResponseHandler> {
    let {username = null, coinId = null} = query

    try {
      if (!username || !coinId)
        throw new BaseError(EHttpStatusCode.BadRequest, "You must specify an username and coinId in the query")
      if (isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
      username = sanitize(username)
      const aggregationPipeline = contactAggregation(username, coinId)
      let user: Document[] = await db.User.aggregate(aggregationPipeline)
      if (!user || !user.length)
        throw new BaseError(EHttpStatusCode.BadRequest, "The username or the coin specified may be invalid")
      return new ValidResponse(EHttpStatusCode.OK, {
        address: user[0]['address']
      })
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async getAllByUser(query: any, userId: string) {
    try {
      if (!userId || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)

      let responseHandler = await this.getAllAggregated(query, userId);
      let accountsnetworks: any = responseHandler.getBody()["items"];
      let account_list = [];

      for (let i = 0; i < accountsnetworks.length; i++) {
        const netAccount = accountsnetworks[i];
        let network = netAccount._id; //network object
        let accounts = netAccount.accounts;

        if (network && network !== "hidden") {
          const RPCHelper: IRPC = rpcs.getInstance(network.name)
          accounts = accounts.filter((item) => item.wallet.user == userId);
          for (let i = 0; i < accounts.length; i++) {
            let account = accounts[i];
            let N_account = { ...account, id: account._id };
            delete N_account._id;
            if (N_account.subscribedTo) {
              N_account = await this.fetchCoins(N_account, RPCHelper);
            }
            delete N_account.privateKey;
            N_account.wallet = N_account.wallet._id;
            accounts[i] = N_account;
          }
        }else{
          // the hidden accounts : without network infos and subscribedTo
          for (let i = 0; i < accounts.length; i++) {
            let account = accounts[i];
            let N_account = { ...account, id: account._id };
            delete N_account._id;
            delete N_account.privateKey;
            N_account.wallet = N_account.wallet._id;
            N_account.subscribedTo= null
            N_account.network_infos= null
            accounts[i] = N_account;
          }
          
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
      if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
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
      if (isValidObjectId(userId) === false || isValidObjectId(walletId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
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

  public async getByAddressProtected(address: string, userId: string) {
    try {
      let item = await this.model.findOne({address}).populate({ 
        path: 'wallet',
        populate: {
          path: 'user',
          model: 'User'
        } 
     })
      if (!item)
        throw new BaseError(EHttpStatusCode.NotFound, "the address is not found on our database.", true)
      return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err, true)
    }
  }
}
