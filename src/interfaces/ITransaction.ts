import { ICoin } from './ICoin'
import { IUser } from './IUser'

export interface ITransaction {
  owner?: string| IUser
  coin?: string | ICoin
  fromAddress: string
  toAddress: string
  value: number
  transactionHash: string
  createdAt?: Date
}