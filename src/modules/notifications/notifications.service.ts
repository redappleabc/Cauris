import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'

export class NotificationsService extends ServiceProtected {
  constructor(model: Model<any> = db.Notification) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(body) {
    const {user, title, content, data} = body
    return super.insert({
      user,
      title,
      content,
      data
    })
  }
}