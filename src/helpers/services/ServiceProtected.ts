import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums';
import { isValidObjectId, Model } from 'mongoose';
import { Service } from './Service'
import sanitize from 'mongo-sanitize'
const mongoose = require("mongoose")

export class ServiceProtected extends Service {
  constructor(model: Model<any>) {
    super(model)
    this.getByIdProtected = this.getByIdProtected.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
    this.updateProtected = this.updateProtected.bind(this)
  }

  public async getByIdProtected(id: string, userId: string) {
    if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    let item = await this.model.findOne({_id: id, user: userId})
    if (!item)
      throw new BaseError(EHttpStatusCode.Unauthorized, "the resource doesnt exist or you do not have access to it", true)
    return new ValidResponse(EHttpStatusCode.OK, item)
  }

  public async getAllByUser(query: any, userId: string) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    query.user = userId
    return super.getAll(query)
  }

  public async updateProtected(id: string, userId: string, data: any) {
    if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    let itemCheck = await this.model.find({_id: id, user: userId})
    var sanitizedData = sanitize(data)
    if (!itemCheck)
      throw new BaseError(EHttpStatusCode.Unauthorized, "You do not have access to this resource")
    return super.update(id, sanitizedData)
  }
}