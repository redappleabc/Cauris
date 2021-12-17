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
    this.updateProtected = this.updateProtected.bind(this)
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
    query.user = userId
    return super.getAll(query)
  }

  public async updateProtected(id: string, userId: string, data: any) {
    try {
      let itemCheck = await this.model.find({_id: id, user: userId})
      if (!itemCheck)
        throw new BaseError(EHttpStatusCode.Unauthorized, "You do not have access to this resource")
      return super.update(id, data)
    } catch(err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }
}