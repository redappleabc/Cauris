import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  seed: {type: String, unique: true, required: true},
  mnemonic: {type: String, unique: true, required: true},
  name: String,
  deleted: {type:Boolean, default: false}
})


schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.seed
    delete ret.mnemonic
  }
})

export const WalletModel = mongoose.model('Wallet', schema)