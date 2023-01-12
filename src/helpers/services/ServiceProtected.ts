import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums';
import { isValidObjectId, Model } from 'mongoose';
import { Service } from './Service'
import sanitize from 'mongo-sanitize'
import { EError } from '@servichain/enums/EError';
const mongoose = require("mongoose")

export class ServiceProtected extends Service {
  constructor(model: Model<any>, name: string = 'Service Protected') {
    super(model, name)
    this.getByIdProtected = this.getByIdProtected.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
    this.updateProtected = this.updateProtected.bind(this)
  }

  public async getByIdProtected(id: string, userId: string) {
    try {
      if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      let item = await this.model.findOne({_id: id, user: userId})
      if (!item)
        throw new BaseError(EHttpStatusCode.Unauthorized, EError.MongoEmpty)
      return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }

  public async getAllByUser(query: any, userId: string) {
    try {
      if (isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      query.user = userId
      return super.getAll(query)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }

  public async updateProtected(id: string, userId: string, data: any) {
    try {
      if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      let itemCheck = await this.model.find({_id: id, user: userId})
      var sanitizedData = sanitize(data)
      if (!itemCheck)
        throw new BaseError(EHttpStatusCode.Unauthorized, EError.MongoEmpty)
      return super.update(id, sanitizedData)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }
}