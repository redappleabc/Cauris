import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '@servichain/helpers/BaseError'
import { db } from '@servichain/helpers/MongooseSingleton'
import { Service } from '@servichain/helpers/services'
import { ICoin, IResponseHandler } from '@servichain/interfaces'
import { isValidObjectId, Model } from 'mongoose'
import { ITokenExplorer } from '@servichain/interfaces/ITokenExplorer'
import { TokenNomics } from '@servichain/helpers/trackers/TokenNomics'
import { CurrencyManager } from '@servichain/helpers/trackers/CurrencyManager'
import { EError } from '@servichain/enums/EError'

const CoinDetailed = {
  vituals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  }
}

export class CoinService extends Service {
  coin: CurrencyManager

  constructor(model: Model<any> = db.Coin) {
    super(model, "[Coin Service]")
    this.insert = this.insert.bind(this)
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.coin = new CurrencyManager()
    setInterval(() => this.coin.resetSelector(), 1000 * 60 * 10)
  }

  public async insert(data: ICoin): Promise<IResponseHandler> {
    try {
      let { network } = data
      if (isValidObjectId(network) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID")
      let netDoc = await db.Network.findOne({ _id: network })
      if (!netDoc)
        throw new BaseError(EHttpStatusCode.NotFound, "Could not find the specified network ID")
      return super.insert(data)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async getAll(query: any): Promise<IResponseHandler> {
    try {
      const {currency} = query
      let responseHandler : ValidResponse = (await super.getAll(query) as ValidResponse);
      if (responseHandler.data?.items?.length && await this.coin.ping()) {
        responseHandler.data.items = await this.coin.getCoins(responseHandler.data.items, currency)
      }
      return responseHandler
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async getById(query: any): Promise<IResponseHandler> {
    try {
      const {currency} = query
      let responseHandler : ValidResponse = (await super.getById(query) as ValidResponse);
      if (await this.coin.ping())
        responseHandler.message = await this.coin.getCoin(responseHandler.message, currency)
      return responseHandler
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }
}