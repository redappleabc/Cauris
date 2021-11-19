import mongoose from 'mongoose';
import { EUserRole } from '@servichain/enums';
const {Schema} = mongoose;

const schema = new Schema({
  email: {type: String, required: true, index: true, unique: true},
  password: {type: String, required: true},
  firstName: String,
  lastName: String,
  role: {type: String, enum: EUserRole, default: EUserRole.User},
  created: {type: Date, default: Date.now()},
  verified: {type: Boolean, default: false},
  updated: Date,
  passwordReset: Date
})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.password
  }
})

export const UserModel = mongoose.model('User', schema)