import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '@servichain/helpers/BaseError'
import db from '@servichain/helpers/MongooseClient'
import { Service } from '@servichain/helpers/services'
import { IResponseHandler } from '@servichain/interfaces'
import { Model , Document} from 'mongoose'
import { response } from 'express'
const CoinGecko = require('coingecko-api')
const CoinGeckoClient = new CoinGecko();

const CoinDetailed = {
  vituals: true,
  versionKey: false,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  }
}

export class CoinService extends Service {
  constructor(model: Model<any> = db.Coin) {
    super(model)
  }

  public async getAll(query: any): Promise<IResponseHandler> {
    try {
      this.pingGecko()
      let {currency} = query ? query : 'eur'
      let responseHandler : ValidResponse = (await super.getAll(query) as ValidResponse);
      const coinArray = responseHandler.data.items.map(item => item.name.toLowerCase())
      const coinData = await this.retrieveCoins(coinArray, currency)
      responseHandler.data.items.forEach((element: any, index: number, items: Array<any>) => {
        items[index] = items[index].toObject(CoinDetailed)
        items[index]['price'] = coinData.data[element.name.toLowerCase()]
      });
      return responseHandler
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
    }
  }

  public async getById(query: any): Promise<IResponseHandler> {
    try {
      this.pingGecko()
      let {currency} = query ? query: 'eur'
      let responseHandler : ValidResponse = (await super.getById(query) as ValidResponse);
      let name: string = responseHandler.data.name.toLowerCase()
      const coinData = await this.retrieveCoins(name, currency)
      responseHandler.data = responseHandler.data.toObject(CoinDetailed)
      responseHandler.data.price = coinData.data[name]
      return responseHandler
    } catch(err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
    }
  }

  private async pingGecko() {
    const ping = await CoinGeckoClient.ping()
    if (!ping || !ping.success)
      throw new BaseError(EHttpStatusCode.InternalServerError, "Coins information could not be retrieved")
  }

  private async retrieveCoins(coinID: Array<string> | String, currency: string) {
    try {
      let coinsData = await CoinGeckoClient.simple.price({ids: coinID, vs_currency: currency, include_24hr_change: true})
      if (!coinsData.success) {
        throw new BaseError(EHttpStatusCode.InternalServerError, "Could not retrieve coins infos")
      }
      return coinsData
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
      }
  }
}