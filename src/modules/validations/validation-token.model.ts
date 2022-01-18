import mongoose from 'mongoose'
import { ETokenType } from '@servichain/enums/ETokenType';
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  token: {type: String, required: true},
  expires: Date,
  type: {type: String, enum: ETokenType, required: true},
  used: {type: Boolean, default: false}
})

schema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

export const ValidationModel = mongoose.model('ValidationToken', schema)