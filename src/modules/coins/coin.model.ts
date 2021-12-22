import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  network: {type: mongoose.Types.ObjectId, ref: 'Network', required: true},
  coinIndex: {type: Number, required: true},
  name: {type: String, required: true},
  symbol: {type: String, required: true},
  decimals: {type: String, required: true},
  contractAddress: String,
  createdAt: {type: Date, default: Date.now()},
})

schema.index({network: 1, coinIndex: 1, contractAddress: 1}, {unique: true})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
  }
})

export const CoinModel = mongoose.model('Coin', schema)