import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  wallet: {type: Schema.Types.ObjectId, ref: 'Wallet', required: true},
  coinIndex: {type: Number, required: true},
  accountIndex: {type: Number, required: true},
  change: {type: Number, required: true},
  addressIndex: {type: Number, required: true},
  publicKey: {type: String, required: true},
  privateKey: {type: String, required: true},
  address: {type: String, required: true}
})

schema.index({wallet: 1, coinIndex: 1, accountIndex: 1, addressIndex: 1}, {unique: true})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.privateKey
  }
})

export const AccountModel = mongoose.model('Account', schema)