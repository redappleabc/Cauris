import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  wallet: {type: Schema.Types.ObjectId, ref: 'Wallet', required: true},
  coin: {type: Schema.Types.ObjectId, ref: 'Coin', required: true},
  accountIndex: Number,
  change: Number,
  addressIndex: Number,
  publicKey: {type: String, required: true},
  privateKey: {type: String, required: true},
  address: {type: String, required: true}
})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.privateKey
    delete ret.accountIndex
    delete ret.addressIndex
    delete ret.wallet
  }
})

export default mongoose.model('Account', schema)