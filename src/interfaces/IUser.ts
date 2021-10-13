import { EUserRole } from "../enums/roles";

export interface IUser {
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: EUserRole,
  created: Date,
  updated: Date,
  verified: Date,
  passwordReset: Date
}