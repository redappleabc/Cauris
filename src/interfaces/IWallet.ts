import { IUser } from "./IUser";

export interface IWallet {
  user: string | IUser
  seed: string
  mnemonic: string
}