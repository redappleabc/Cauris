import {db} from "@servichain/helpers/MongooseSingleton";
import { ServiceProtected } from "@servichain/helpers/services";
import { isValidObjectId, Model } from "mongoose";
import { HDWallet } from "@servichain/helpers/hdwallets/HDWallet";
import { EthereumWallet } from "@servichain/helpers/hdwallets/EthereumWallet";
import { BitcoinWallet } from "@servichain/helpers/hdwallets/BitcoinWallet";
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
import { rpcs } from "@servichain/helpers/RPCSingleton";
import { utils } from "ethers";
import { accountsAggregation, addressesAggregation, contactAggregation } from "./account.aggregation";
import sanitize from 'mongo-sanitize'
import { AESHelper } from "@servichain/helpers/AESHelper";
import { CoinService } from "../coins";
import { EError } from "@servichain/enums/EError";
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

export class AccountService extends ServiceProtected {
  constructor(model: Model<any> = db.Account) {
    super(model, "[Account Service]");
    this.generate = this.generate.bind(this);
    this.generateOne = this.generateOne.bind(this);
    this.getAllByUser = this.getAllByUser.bind(this);
    this.getByCoinId = this.getByCoinId.bind(this)
    this.getAllAddresses = this.getAllAddresses.bind(this)
  }

  public async getAllAddresses(query: any) {
    try {
      let {limit=20, skip=0, network=null} = query
  
      const addressesPipeline = addressesAggregation(limit, skip, network)
      let users: Document[] = await db.User.aggregate(addressesPipeline)
      let coinService = new CoinService()
      let coins: Document[] = (await coinService.getAll({currency: "USD"})).getBody()?.items
      let totalUSD = 0
      for (let i = 0; i < users.length; i++) {
        let balance = 0
        const AES = new AESHelper(users[i]['_id'])
        await AES.initialize()
        balance = await this.getBalanceByNetwork(users[i], AES, coins)
        totalUSD += balance
        delete users[i]['subscribedCoins']
        users[i]['balance'] = balance
      }
      let total: number = await this.model.count()
      return new ValidResponse(EHttpStatusCode.OK, {
        items: users,
        total,
        totalUSD
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  private async getBalanceByNetwork({networks}: any, AES: AESHelper, coins: Document[]) {
    let total = 0
    for (let x = 0; x < networks.length; x++) {
      const RPCHelper: IRPC = rpcs.getInstance(networks[x].name)
      for (let y = 0; y < networks[x].accounts.length; y++) {
        let {account, totalAccount} = await this.fetchCoinsAggregation(networks[x].accounts[y], RPCHelper, AES, coins)
        networks[x].accounts[y] = account
        total += totalAccount
      }
    }
    return total
  }

  private calculateBalance(subscribedCoin: any, coins: any) {
    let selectedCoin = coins.filter(c => c.name === subscribedCoin.name)[0]
    let balanceUSD = subscribedCoin.balance * selectedCoin.price
    return balanceUSD
  }

  private async fetchCoinsAggregation(account: any, RPCHelper: IRPC, AES: AESHelper, coins: Document[]) {
    let totalAccount = 0
  
    for (let i = 0; i < account.subscribedTo.length; i++) {
      let coinID = account.subscribedTo[i]
      let {balance, coin} = await this.getBalance(
      coinID,
      account,
      RPCHelper,
      AES
    )
        account.subscribedTo[i] = {balance, name: coin.name}
        account.subscribedTo[i].balanceUSD = this.calculateBalance(account.subscribedTo[i], coins)
        totalAccount += account.subscribedTo[i].balanceUSD
    }

    delete account.publicKey
    delete account.privateKey
    delete account.accountIndex
    delete account.change
    delete account.addressIndex
    return {account, totalAccount};
  }


  private async getAllAggregated(query: any, userId: string): Promise<IResponseHandler> {
    let { skip, limit, populate, wallet=null } = query;

    skip = skip ? Number(skip) : 0;
    limit = limit ? Number(limit) : 25;
    populate = populate ? populate : "";

    delete query.skip;
    delete query.limit;
    delete query.$match

    if (isValidObjectId(userId) === false || isValidObjectId(wallet) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
    let walletExist = db.Wallet.findOne({_id: wallet, user: userId})
    if (!walletExist)
      throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoEmpty)
    const aggregationPipeline = accountsAggregation(wallet, userId)
    let accountsByNetwork: Document[] = await this.model
      .aggregate(aggregationPipeline)
      .group({ _id: "$network_infos", accounts: { $push: "$$ROOT" } });
    let total: number = await this.model.count(query);
    if (!accountsByNetwork)
      throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
    return new ValidResponse(EHttpStatusCode.OK, {
      items: accountsByNetwork,
      total,
    });
  }

  public async getByCoinId(query: any): Promise<IResponseHandler> {
    try {
      let {username = null, coinId = null} = query

      if (!username || !coinId)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.ReqIncompleteQuery + this.name)
      if (isValidObjectId(coinId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID + this.name)
      username = sanitize(username)
      const aggregationPipeline = contactAggregation(username, coinId)
      let user: Document[] = await db.User.aggregate(aggregationPipeline)
      if (!user || !user.length)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoEmpty + this.name)
      return new ValidResponse(EHttpStatusCode.OK, {
        address: user[0]['address']
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async getAllByUser(query: any, userId: string) {
    try {
      if (!userId || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID")
  
      let responseHandler = await this.getAllAggregated(query, userId);
      let accountsnetworks: any = responseHandler.getBody()["items"];
      let account_list = [];
  
      const AES = new AESHelper(userId)
      await AES.initialize()
  
      for (let i = 0; i < accountsnetworks.length; i++) {
        const netAccount = accountsnetworks[i];
        let network = netAccount._id;
        let accounts = netAccount.accounts;
  
        if (network && network !== "hidden") {
          const RPCHelper: IRPC = rpcs.getInstance(network.name)
          accounts = accounts.filter((item) => item.wallet.user == userId);
          for (let i = 0; i < accounts.length; i++) {
            let account = accounts[i];
            let N_account = { ...account, id: account._id };
            delete N_account._id;
            if (N_account.subscribedTo) {
              N_account = await this.fetchCoins(N_account, RPCHelper, AES);
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
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async updateProtected(id: string, userId: string, data: IAccount) {
    try {
      if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
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
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  private getHDWalletByCoinIndex(coinIndex: number) {
    if(coinIndex === 0)
      return BitcoinWallet
    return EthereumWallet
  }

  public async generate(
    userId: string,
    walletId: string,
    accountsArray: [IAccount] | IAccount
  ) {
    try {
      if (isValidObjectId(userId) === false || isValidObjectId(walletId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      const userWallet: IWallet = await db.Wallet.findOne({
        user: userId,
        _id: walletId,
      });
      if (!userWallet)
        throw new BaseError(EHttpStatusCode.Forbidden, EError.AccountNoWallet);
      const AES = new AESHelper(userId)
      await AES.initialize()
  
  
      if (accountsArray instanceof Array === false) {
        let responseItem: IAccount = await this.generateOne(
          walletId,
          userWallet,
          AES,
          accountsArray as IAccount
        );
        if (!responseItem)
          throw new BaseError( EHttpStatusCode.NotFound, EError.MongoEmpty);
        return new ValidResponse(EHttpStatusCode.Created, responseItem);
      } else {
        let responseArray: Array<IAccount> = [];
        for (let i = 0; i < (accountsArray as [IAccount]).length; i++) {
          let item = (accountsArray as [IAccount])[i];
          let accountResponse = await this.generateOne(
            walletId,
            userWallet,
            AES,
            item
          );
          if (accountResponse) responseArray.push(accountResponse);
        }
        if (!responseArray.length)
          throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
        return new ValidResponse(EHttpStatusCode.Created, responseArray);
      }
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async generateOne(
    wallet: string,
    userWallet: IWallet,
    AES: AESHelper,
    {
      coinIndex,
      accountIndex = 0,
      change = 0,
      addressIndex = 0,
      subscribedTo,
    }: IAccount
  ): Promise<IAccount> {
    try {
      const coinItem: ICoin = await db.Coin.findOne({ coinIndex });
      if (!coinItem) return null;
  
      const hdWallet: HDWallet = new (this.getHDWalletByCoinIndex(coinIndex))(AES.decrypt(userWallet.mnemonic));
  
      let keyPair = hdWallet.generateKeyPair(
        coinIndex,
        accountIndex,
        change,
        addressIndex
      );
      if (
        subscribedTo &&
        (await this.checkCoinIds(subscribedTo as string[])) === false
      ) {
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
      } else if (!subscribedTo)
        subscribedTo = await this.defaultSubscription(coinIndex);
      keyPair.privateKey = AES.encrypt(keyPair.privateKey)
      let newAccount: IAccount = {
        wallet,
        coinIndex,
        accountIndex,
        change,
        addressIndex,
        subscribedTo,
        ...keyPair,
      };
      return this.model.create(newAccount);
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
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

  private async fetchCoins(account: any, RPCHelper: IRPC, AES: AESHelper) {
    let coinID: string = account.subscribedTo["_id"] as string;
    let {balance} = await this.getBalance(
      coinID,
      account,
      RPCHelper,
      AES
    );
    account.subscribedTo["balance"] = balance
    return account;
  }

  private async getBalance(coinID: string, account: IAccount, RPCHelper: IRPC, AES: AESHelper) {
    const coin: ICoin = await db.Coin.findOne({ _id: coinID }).populate(
      "network"
    );
    account.privateKey = AES.decrypt(account.privateKey)
    RPCHelper.setWallet(account);
    let balance = (
      await RPCHelper.getBalance(coin.contractAddress)
    )
    account.privateKey = AES.encrypt(account.privateKey)
    if ((coin.network as INetwork).type === 1) {
      return {balance: balance.toString(), coin}
    } else
      return {balance: utils.formatUnits(balance, coin.decimals), coin};
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
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async migratingCoins() {
    try {
      await db.Coin.updateMany({coinIndex: {$gt: 60}}, {$set: {coinIndex: 60}})
      await db.Account.deleteMany({coinIndex: {$gt: 60}})
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }
}