import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class ContactsService extends ServiceProtected {
  constructor(model: Model<any> = db.Contact) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, address: string = null, name: string = null, email: string= null) {
    return super.insert({
      user: userId,
      name,
      address, email
    })
  }
}