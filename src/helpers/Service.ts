import { ValidResponse } from './RequestHelpers/ValidResponse'
import { IResponseHandler } from '../interfaces/IResponseHandler'
import { BaseError } from './BaseError'
import { Model, ObjectId } from 'mongoose'
import { IService } from "../interfaces/IService";
import { EHttpStatusCode } from '../enums/EHttpError';
const mongoose = require("mongoose")

export default class Service implements IService {
  model: Model<any>;

  constructor(model: Model<any>) {
    this.model = model
    this.getAll = this.getAll.bind(this)
    this.insert = this.insert.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
  }

  public async getAll(query: any): Promise<IResponseHandler> {
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
      let items = await this.model.find(query).skip(skip).limit(limit)
      let total = await this.model.count()

      return new ValidResponse(EHttpStatusCode.OK, {
        data: items,
        total
      })
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async getById(id: string): Promise<IResponseHandler> {
    try {
      let item = this.model.findById(id)
      if (item)
        return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async insert(data: any): Promise<IResponseHandler> {
    try {
      let item = await this.model.create(data)
      if (item)
        return new ValidResponse(EHttpStatusCode.Created, item)
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async update(id: string, data: any): Promise<IResponseHandler> {
    try {
      let item = await this.model.findByIdAndUpdate(id, data, {new: true})
      if (!item) {
        throw new BaseError(EHttpStatusCode.NotFound, "Item not found.", true)
      }
      return new ValidResponse(EHttpStatusCode.Accepted, item)
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async delete(id: string): Promise<IResponseHandler> {
    try {
      let item = await this.model.findByIdAndDelete(id)
      if (!item) {
        throw new BaseError(EHttpStatusCode.NotFound, "Item not found.", true)
      }
      return new ValidResponse(EHttpStatusCode.Accepted, item)
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }
}