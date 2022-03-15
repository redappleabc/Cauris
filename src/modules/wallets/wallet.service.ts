import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'

export class WalletService extends ServiceProtected {
  constructor(model: Model<any> = db.Wallet) {
    super(model)
    this.generate = this.generate.bind(this)
    this.deleteLogically = this.deleteLogically.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
  }

  public async getAllByUser(query: any, userId: string) {
    query.user = userId
    query.deleted = false
    return super.getAll(query)
  }

  public async generate(userId: string, userMnemonic: string = null, name: string = null) {
    const wallet: HDWallet = new HDWallet(userMnemonic)
    const {mnemonic, seed} = wallet.getWallet()
    return super.insert({
      user: userId,
      mnemonic,
      seed,
      name
    })
  }
  public async deleteLogically(id: string = null, userId: string = null) {
    try {
      let itemCheck = await this.model.find({_id: id, user: userId})
      if (!itemCheck)
        throw new BaseError(EHttpStatusCode.Unauthorized, "You do not have access to this resource")
      return super.update(id, {
        ...itemCheck,
        deleted:true
      })
    } catch(err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, err)
    }
  }
}