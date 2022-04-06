import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import sanitize from 'mongo-sanitize'

export class NotificationsService extends ServiceProtected {
  constructor(model: Model<any> = db.Notification) {
    super(model)
    this.generate = this.generate.bind(this)
  }

  public async generate(body) {
    let {user, title, content, data} = body
    title = sanitize(title)
    content = sanitize(content)
    data = sanitize(content)
    return super.insert({
      user,
      title,
      content,
      data
    })
  }
}