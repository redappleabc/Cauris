import { ETokenType } from "@servichain/enums";
import { IUser } from "./IUser";

export default interface IValidation {
  user: string | IUser
  token?: String
  expires?: Date
  type?: ETokenType
  used: Boolean
}