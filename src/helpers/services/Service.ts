import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { BaseError } from '@servichain/helpers/BaseError'
import { Document, isValidObjectId, Model } from 'mongoose'
import { IService, IResponseHandler } from "@servichain/interfaces";
import { EHttpStatusCode } from '@servichain/enums';
import sanitize from 'mongo-sanitize'
import { EError } from '@servichain/enums/EError';
const mongoose = require("mongoose")

export class Service implements IService {
  model: Model<any>;
  name: string;

  constructor(model: Model<any>, name: string = 'Service') {
    this.model = model
    this.name = name
    this.getAll = this.getAll.bind(this)
    this.insert = this.insert.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
    this.getById = this.getById.bind(this)
  }

  public async getAll(query: any): Promise<IResponseHandler> {
    try {
      let {skip, limit, populate} = query
  
      skip = skip ? Number(skip) : 0
      limit = limit ? Number(limit): 25
      populate = populate ? populate : ''
  
      delete query.skip
      delete query.limit
      delete query.$match
  
      query = sanitize(query)
  
      if (query._id && isValidObjectId(query._id) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
  
      let items: Document[] = await this.model.find(query).skip(skip).limit(limit).populate(populate)
      let total: number = await this.model.count(query)
      if (!items)
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      return new ValidResponse(EHttpStatusCode.OK, {
        items,
        total
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }

  public async getById(id: string): Promise<IResponseHandler> {
    try {
      if (isValidObjectId(id) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      let item: Document = await this.model.findById(id)
      if (!item)
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      return new ValidResponse(EHttpStatusCode.OK, item)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }

  public async insert(data: any): Promise<IResponseHandler> {
    try {
      let item: Document = await this.model.create(data)
      if (!item)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoCreate)
      return new ValidResponse(EHttpStatusCode.Created, item)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }

  public async update(id: string, data: any): Promise<IResponseHandler> {
    try {
      var sanitizedData = sanitize(data)
      if (isValidObjectId(id) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      let item: Document = await this.model.findByIdAndUpdate(id, sanitizedData, {new: true})
      if (!item) {
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      }
      return new ValidResponse(EHttpStatusCode.Accepted, item)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }

  public async delete(id: string): Promise<IResponseHandler> {
    try {
      if (isValidObjectId(id) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      let item: Document = await this.model.findByIdAndDelete(id)
      if (!item) {
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      }
      return new ValidResponse(EHttpStatusCode.Accepted, item)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
    }
  }
}