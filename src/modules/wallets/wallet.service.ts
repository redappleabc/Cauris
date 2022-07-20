import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Document, isValidObjectId, Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { AESHelper } from '@servichain/helpers/AESHelper'

export class WalletService extends ServiceProtected {
  constructor(model: Model<any> = db.Wallet) {
    super(model)
    this.generate = this.generate.bind(this)
    this.deleteLogically = this.deleteLogically.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
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
    const wallet: HDWallet = new HDWallet(userMnemonic)
    const {mnemonic, seed} = wallet.getWallet()
    return super.insert({
      user: userId,
      mnemonic: AES.encrypt(mnemonic),
      seed: AES.encrypt(seed),
      name
    })
  }

  public async encryptAll() {
    let accItems: Document[] = await db.Account.find().populate('wallet')

    accItems.forEach((item: Document) => {
      let AES = new AESHelper(item['wallet']['user'])
      AES.encrypt(item['privateKey'])
      item.save()
    })

    let walletItems: Document[] = await db.Wallet.find()

    walletItems.forEach((item: Document) => {
      let AES = new AESHelper(item['user'])
      AES.encrypt(item['seed'])
      AES.encrypt(item['mnemonic'])
      item.save()
    })
  }

  public async deleteLogically(id: string = null, userId: string = null) {
    if (isValidObjectId(id) === false || isValidObjectId(userId) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid Mongo ID", true)

    let itemCheck = await this.model.find({_id: id, user: userId})
    if (!itemCheck)
      throw new BaseError(EHttpStatusCode.Unauthorized, "You do not have access to this resource")
    return super.update(id, {...itemCheck, deleted:true})
  }
}