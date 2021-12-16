import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums';
import { Model } from 'mongoose';
import { Service } from './Service'
const mongoose = require("mongoose")

export class ServiceProtected extends Service {
  constructor(model: Model<any>) {
    super(model)
    this.getByIdProtected = this.getByIdProtected.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
  }

  public async getByIdProtected(id: string, userId: string) {
    try {
      let item = await this.model.findOne({_id: id, user: userId})
      if (!item)
        throw new BaseError(EHttpStatusCode.Unauthorized, "the resource doesnt exist or you do not have access to it", true)
      return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err, true)
    }
  }

  public async getAllByUser(query: any, userId: string) {
    let {skip, limit} = query

    skip = skip ? Number(skip) : 0
    limit = limit ? Number(limit): 25

    delete query.skip
    delete query.limit

    if (query._id) {
      try {
        query._id = new mongoose.mongo.ObjectId(query._id)
      } catch (error) {
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid query ID", true)
      }
    }

    try {
      let items: Document[] = await this.model.find({user: userId, ...query}).skip(skip).limit(limit)
      let total: number = items.length

      if (!items)
        throw new BaseError(EHttpStatusCode.NotFound, "Empty list.", true)
      return new ValidResponse(EHttpStatusCode.OK, {
        items,
        total
      })
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }
}