import db from '@servichain/helpers/MongooseClient'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class NotificationsService extends ServiceProtected {
  constructor(model: Model<any> = db.Notification) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(userId: string, title: string = null, content: string= null) {
    return super.insert({
      user: userId,
      title,
      content
    })
  }
}