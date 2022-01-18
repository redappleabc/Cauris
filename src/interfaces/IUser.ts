import { EUserRole } from "@servichain/enums";

export interface IUser {
  id?: string | string
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: EUserRole
  created?: Date
  updated?: Date
  verified?: Date
  passwordReset?: Date
}