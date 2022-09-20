import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '@servichain/helpers/BaseError'
import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { isValidObjectId, Model } from 'mongoose'
import sanitize from 'mongo-sanitize'

export class ContactsService extends ServiceProtected {
  constructor(model: Model<any> = db.Contact) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, address: string = null, name: string = null, username: string= null) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    name = sanitize(name)
    address = sanitize(address)
    username = sanitize(username)
    return super.insert({
      user: userId,
      name,
      address,
      username
    })
  }
}