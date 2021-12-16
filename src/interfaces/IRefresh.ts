import { IUser } from "./IUser";

export default interface IRefresh {
  id?: string
  user: string | IUser
  token: string
  expires: Date
  created?: Date
  createdByIp?: String
  revoked?: Date
  revokedByIp?: String
  replacedByToken?: String
}