import mongoose from 'mongoose'
import { ETokenType } from '../../enums/ETokenType';
const Schema = mongoose.Schema

const schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  token: String,
  expires: Date,
  type: {type: String, enum: ETokenType},
  used: {type: Boolean, default: false}
})

schema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

export default mongoose.model('ValidationToken', schema)