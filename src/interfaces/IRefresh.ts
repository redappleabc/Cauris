import { Schema } from "mongoose";

export default interface IRefresh {
  user: Schema.Types.ObjectId,
  token: String,
  expires: Date,
  created: Date,
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String
}