import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '@servichain/helpers/BaseError'
import {db} from '@servichain/helpers/MongooseSingleton'
import { Service } from '@servichain/helpers/services'
import { ICoin, IResponseHandler } from '@servichain/interfaces'
import { Model } from 'mongoose'
import config from 'config'
import Nomics, { IRawCurrencyTicker } from 'nomics'

const nomics = new Nomics({
  apiKey: config.get('secrets.nomics')
})

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
    this.insert = this.insert.bind(this)
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
  }

  public async insert(data: ICoin): Promise<IResponseHandler> {
    try {
      let {network} = data
      let netDoc = await db.Network.findOne({_id: network})
      if (!netDoc)
        throw new BaseError(EHttpStatusCode.NotFound, "Could not find the specified network ID")
      return super.insert(data)
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  public async getAll(query: any): Promise<IResponseHandler> {
    try {
      let currency = (query && query.currency) ? query.currency : 'USD'
      let responseHandler : ValidResponse = (await super.getAll(query) as ValidResponse);
      if (responseHandler.data.items.length) {
        const coinArray: string[] = responseHandler.data.items.map(item => item.symbol.toUpperCase())
        const coinData: IRawCurrencyTicker[] = await this.retrieveCoinsNomics(coinArray, currency)
        responseHandler.data.items.forEach((element: ICoin, index: number, items: Array<any>) => {
          items[index] = items[index].toObject(CoinDetailed)
          let match = coinData.filter((item: IRawCurrencyTicker) => item.symbol === element.symbol)
          items[index]['price'] = match[0].price
          if (!items[index]['logo'])
            items[index]['logo'] = match[0].logo_url
          items[index]['price_currency'] = currency
        });
      }
      return responseHandler
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  public async getById(query: any): Promise<IResponseHandler> {
    try {
      let currency = (query && query.currency) ? query.currency : 'USD'
      let responseHandler : ValidResponse = (await super.getById(query) as ValidResponse);
      let symbol: string[] = [responseHandler.data.symbol.toUpperCase()]
      const coinData: IRawCurrencyTicker[] = await this.retrieveCoinsNomics(symbol, currency)
      responseHandler.message = responseHandler.message.toObject(CoinDetailed)
      responseHandler.message['price'] = coinData[0].price
      if (!responseHandler.message['logo'])
        responseHandler.message['logo'] = coinData[0].logo_url
      responseHandler.message['price_currency'] = currency
      return responseHandler
    } catch(err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }

  private async retrieveCoinsNomics(coinID: Array<string>, currency: string) {
    try {
      let coinsData = await nomics.currenciesTicker({
        interval: ['1d'],
        ids: coinID,
        convert: currency
      })
      if (!coinsData) {
        throw new BaseError(EHttpStatusCode.InternalServerError, "Could not retrieve coins infos")
      }
      return coinsData
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
      }
  }
}