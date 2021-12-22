import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  coin: {type: Schema.Types.ObjectId, ref: 'Coin', required: true},
  fromAddress: {type: String, required: true},
  toAddress: {type: String, required: true},
  value: {type: String, required: true},
  transactionHash: {type: String, required: true},
  createdAt: {type: Date, default: Date.now()},
})


schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.user
  }
})

export const TransactionModel = mongoose.model('Transaction', schema)