import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '@servichain/helpers/BaseError'
import {db} from '@servichain/helpers/MongooseSingleton'
import { Service } from '@servichain/helpers/services'
import { ICoin, IResponseHandler } from '@servichain/interfaces'
import { isValidObjectId, Model } from 'mongoose'
import { ITokenExplorer } from '@servichain/interfaces/ITokenExplorer'
import { TokenNomics } from '@servichain/helpers/TokenNomics'

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
  coin: ITokenExplorer

  constructor(model: Model<any> = db.Coin) {
    super(model)
    this.insert = this.insert.bind(this)
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.coin = new TokenNomics()
  }

  public async insert(data: ICoin): Promise<IResponseHandler> {
    let {network} = data
    if (isValidObjectId(network) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    let netDoc = await db.Network.findOne({_id: network})
    if (!netDoc)
      throw new BaseError(EHttpStatusCode.NotFound, "Could not find the specified network ID")
    return super.insert(data)
  }

  public async getAll(query: any): Promise<IResponseHandler> {
    let responseHandler : ValidResponse = (await super.getAll(query) as ValidResponse);
    if (responseHandler.data?.items?.length) {
      console.log("passed length check")
      responseHandler.data.items = await this.coin.getCoins(responseHandler.data.items)
    }
    return responseHandler
  }

  public async getById(query: any): Promise<IResponseHandler> {
    let responseHandler : ValidResponse = (await super.getById(query) as ValidResponse);
    responseHandler.message = await this.coin.getCoin(responseHandler.message)
    return responseHandler
  }
}