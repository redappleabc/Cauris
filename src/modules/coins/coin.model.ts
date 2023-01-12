import mongoose from 'mongoose'
import { AccountModel } from '../accounts/account.model'
import { BaseError } from '@servichain/helpers/BaseError'
import { EError } from '@servichain/enums/EError'
import { EHttpStatusCode } from '@servichain/enums'

const Schema = mongoose.Schema

const schema = new Schema({
  network: { type: mongoose.Types.ObjectId, ref: 'Network', required: true },
  coinIndex: { type: Number, required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  decimals: { type: String, required: true },
  logo: String,
  contractAddress: String,
  createdAt: { type: Date, default: Date.now() },
})


schema.index({ network: 1, coinIndex: 1, contractAddress: 1 }, { unique: true })

schema.pre('deleteMany', async function (next) {
  try {
    const results = await CoinModel.find(this.getQuery())
    results.forEach((item) => {
      AccountModel.updateMany({}, { $pull: { "subscribedTo": item._id } }).exec()
    })
  } catch (e) {
    throw new BaseError(EHttpStatusCode.InternalServerError, EError.MongoOffline, e, true)
  }
  next();
});



schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id
  }
})

export const CoinModel = mongoose.model('Coin', schema)