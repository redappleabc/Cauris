import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  name: {type: String, required: true},
  url: String,
  chainId: {type: Number, unique: true},
  blockExplorer: String,
  currencySymbol: String
})


schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
  }
})

export const NetworkModel = mongoose.model('Network', schema)