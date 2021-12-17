import { ICoin } from './ICoin'
import { IWallet } from './IWallet'

export interface IAccount {
  id?: string
  wallet: string | IWallet
  coinIndex: number
  accountIndex?: number
  change?: number
  addressIndex?: number
  publicKey: string
  privateKey: string
  address: string
  subscribedTo: string[] | ICoin[]
}