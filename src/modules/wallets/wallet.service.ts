import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Document, isValidObjectId, Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { AESHelper } from '@servichain/helpers/AESHelper'
import { randomBytes } from 'ethers/lib/utils'
import { ValidResponse } from '@servichain/helpers/responses'
const { performance } = require('perf_hooks');

const Detailed = {
  vituals: true,
  versionKey: false,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  }
}

export class WalletService extends ServiceProtected {
  constructor(model: Model<any> = db.Wallet) {
    super(model)
    this.generate = this.generate.bind(this)
    this.deleteLogically = this.deleteLogically.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
    this.getByIdProtected = this.getByIdProtected.bind(this)
  }

  public async getByIdProtected(id: string, userId: string) {
    if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    let item: Document = await this.model.findOne({_id: id, user: userId})
    if (!item)
      throw new BaseError(EHttpStatusCode.Unauthorized, "the resource doesnt exist or you do not have access to it", true)
    const wallet: any = item.toObject(Detailed)
    const AES = new AESHelper(userId)
    await AES.initialize()

    wallet.mnemonic = AES.decrypt(wallet.mnemonic)
    wallet.seed = AES.decrypt(wallet.seed)
    return new ValidResponse(EHttpStatusCode.OK, wallet)
  }

  public async getAllByUser(query: any, userId: string) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)
    query.user = userId
    query.deleted = false
    return super.getAll(query)
  }

  public async generate(userId: string, userMnemonic: string = null, name: string = null) {
    if (isValidObjectId(userId) === false)
      throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)

    const AES = new AESHelper(userId)
    await AES.initialize()

    const wallet: HDWallet = new HDWallet(userMnemonic)
    const {mnemonic, seed} = wallet.getWallet()
    return super.insert({
      user: userId,
      mnemonic: AES.encrypt(mnemonic),
      seed: AES.encrypt(seed),
      name
    })
  }

  public async deleteLogically(id: string = null, userId: string = null) {
    if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)

    let itemCheck = await this.model.findOne({_id: id, user: userId})
    if (!itemCheck)
      throw new BaseError(EHttpStatusCode.Unauthorized, "You do not have access to this resource")
    return super.update(id, {...itemCheck, deleted:true})
  }
}