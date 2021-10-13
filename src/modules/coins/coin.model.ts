import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  coinIndex: {type: Number, required: true, index: true},
  name: {type: String, required: true},
  symbol: {type: String, required: true},
  contractAddress: String,
  createdAt: {type: Date, default: Date.now()},
})


schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
  }
})

export default mongoose.model('Coin', schema)