import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums';
import { Model } from 'mongoose';
import { Service } from './Service'

export class ServiceProtected extends Service {
  constructor(model: Model<any>) {
    super(model)
    this.getByIdProtected = this.getByIdProtected.bind(this)
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
}