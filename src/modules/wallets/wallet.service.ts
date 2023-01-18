import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Document, isValidObjectId, Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { AESHelper } from '@servichain/helpers/AESHelper'
import { randomBytes } from 'ethers/lib/utils'
import { ValidResponse } from '@servichain/helpers/responses'
import { EError } from '@servichain/enums/EError'
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
    super(model, "[Wallet Service]")
    this.generate = this.generate.bind(this)
    this.deleteLogically = this.deleteLogically.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
    this.getByIdProtected = this.getByIdProtected.bind(this)
  }

  public async getByIdProtected(id: string, userId: string) {
    try {
      if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      let item: Document = await this.model.findOne({_id: id, user: userId})
      if (!item)
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      const wallet: any = item.toObject(Detailed)
      const AES = new AESHelper(userId)
      await AES.initialize()
  
      wallet.mnemonic = AES.decrypt(wallet.mnemonic)
      wallet.seed = AES.decrypt(wallet.seed)
      return new ValidResponse(EHttpStatusCode.OK, wallet)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async getAllByUser(query: any, userId: string) {
    try {
      if (isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      query.user = userId
      query.deleted = false
      return super.getAll(query)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async generate(userId: string, userMnemonic: string = null, name: string = null) {
    try {
      if (isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)

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
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async deleteLogically(id: string = null, userId: string = null) {
    try {
      if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
  
        let itemCheck = await this.model.findOne({_id: id, user: userId})
        if (!itemCheck)
          throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
        return super.update(id, {...itemCheck, deleted:true})
      } catch (e) {
        throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
      }
    }
}