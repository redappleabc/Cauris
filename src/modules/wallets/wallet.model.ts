import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  seed: {type: String, unique: true, required: true},
  mnemonic: {type: String, unique: true, required: true}
})


schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.seed
  }
})

export const WalletModel = mongoose.model('Wallet', schema)