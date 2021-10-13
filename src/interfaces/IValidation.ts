import { Schema } from "mongoose";
import { ETokenType } from "../enums/ETokenType";

export default interface IValidation {
  user: Schema.Types.ObjectId,
  token: String,
  expires: Date,
  type: ETokenType,
  used: Boolean
}