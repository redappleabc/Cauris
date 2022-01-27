import { ENetworkType } from '@servichain/enums'
import mongoose from 'mongoose'
const Schema = mongoose.Schema

const schema = new Schema({
  name: {type: String, required: true},
  chainId: {type: Number, unique: true},
  rpcUrl: {type: String, required: true, unique: true},
  apiUrl: String,
  explorerUrl: String,
  configKey: String,
  currencySymbol: {type: String, required: true},
  type: {type: Number, enum: ENetworkType, default: ENetworkType.evm}
})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.configKey
    delete ret.apiUrl
    delete ret.rpcUrl
  }
})

export const NetworkModel = mongoose.model('Network', schema)