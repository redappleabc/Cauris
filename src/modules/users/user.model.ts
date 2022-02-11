import mongoose from "mongoose";
import { EUserRole } from "@servichain/enums";
const { Schema } = mongoose;

const schema = new Schema({
  email: { type: String, required: true, index: true, unique: true },
  username: {type: String, 
    required: true, 
    index: true, 
    unique: true, 
    default: function() {
      const instance = this as any
      instance.username = instance.email.match(/[^(@.)]+/)[0];
    }},
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: { type: String, enum: EUserRole, default: EUserRole.User },
  created: { type: Date, default: Date.now() },
  verified: { type: Boolean, default: false },
  devices: [{ type: String, default: [] }],
  pin: {type: String, default: null},
  updated: Date,
  passwordReset: Date,
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
    delete ret.created;
    delete ret.updated;
    delete ret.passwordReset;
  },
});

export const UserModel = mongoose.model("User", schema);
