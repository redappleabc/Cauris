import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { BaseError } from '@servichain/helpers/BaseError'
import { Document, Model } from 'mongoose'
import { IService, IResponseHandler } from "@servichain/interfaces";
import { EHttpStatusCode } from '@servichain/enums';
const mongoose = require("mongoose")

export class Service implements IService {
  model: Model<any>;

  constructor(model: Model<any>) {
    this.model = model
    this.getAll = this.getAll.bind(this)
    this.insert = this.insert.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
    this.getById = this.getById.bind(this)
  }

  public async getAll(query: any): Promise<IResponseHandler> {
    let {skip, limit, populate} = query

    skip = skip ? Number(skip) : 0
    limit = limit ? Number(limit): 25
    populate = populate ? populate : ''

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
      let items: Document[] = await this.model.find({query}).skip(skip).limit(limit).populate(populate)
      let total: number = await this.model.count({query})

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

  public async getById(id: string): Promise<IResponseHandler> {
    try {
      let item: Document = await this.model.findById(id)
      if (!item)
        throw new BaseError(EHttpStatusCode.NotFound, "Item not found.", true)
      return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async insert(data: any): Promise<IResponseHandler> {
    try {
      let item: Document = await this.model.create(data)
      if (!item)
        throw new BaseError(EHttpStatusCode.BadRequest, "Could not create item")
      return new ValidResponse(EHttpStatusCode.Created, item)
    } catch (error) {
      if (error instanceof mongoose.Error) {
        throw new BaseError(EHttpStatusCode.BadRequest, error, true)
      } else
        throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }

  public async update(id: string, data: any): Promise<IResponseHandler> {
    try {
      let item: Document = await this.model.findByIdAndUpdate(id, data, {new: true})

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
      let item: Document = await this.model.findByIdAndDelete(id)

      if (!item) {
        throw new BaseError(EHttpStatusCode.NotFound, "Item not found.", true)
      }
      return new ValidResponse(EHttpStatusCode.Accepted, item)
    } catch (error) {
      throw new BaseError(EHttpStatusCode.InternalServerError, error, true)
    }
  }
}