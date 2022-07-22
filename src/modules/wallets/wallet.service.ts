import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { Document, isValidObjectId, Model } from 'mongoose'
import { HDWallet } from '@servichain/helpers/hdwallets'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { AESHelper } from '@servichain/helpers/AESHelper'
import { randomBytes } from 'ethers/lib/utils'
import { ValidResponse } from '@servichain/helpers/responses'

export class WalletService extends ServiceProtected {
  constructor(model: Model<any> = db.Wallet) {
    super(model)
    this.generate = this.generate.bind(this)
    this.deleteLogically = this.deleteLogically.bind(this)
    this.getAllByUser = this.getAllByUser.bind(this)
    this.encryptAll = this.encryptAll.bind(this)
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

  public async encryptAll() {
    let accItems: Document[] = await db.Account.find().populate('wallet')

    for (let i = 0; i < accItems.length; i++) {
      let AES = new AESHelper(accItems[i]['wallet']['user'])
      await AES.initialize()

      accItems[i]['privateKey'] = AES.encrypt(accItems[i]['privateKey'])
      accItems[i].save()
    }

    let walletItems: Document[] = await db.Wallet.find()

    for (let i = 0; i < walletItems.length; i++) {
      let AES = new AESHelper(walletItems[i]['user'])
      await AES.initialize()

      walletItems[i]['seed'] = AES.encrypt(walletItems[i]['seed'])
      walletItems[i]['mnemonic'] = AES.encrypt(walletItems[i]['mnemonic'])
      walletItems[i].save()
    }

    return new ValidResponse(200, 'Encryption complete')
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