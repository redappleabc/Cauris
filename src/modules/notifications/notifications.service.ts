import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import sanitize from 'mongo-sanitize'

export class NotificationsService extends ServiceProtected {
  constructor(model: Model<any> = db.Notification) {
    super(model)
  }
}