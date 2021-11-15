import ethers from 'ethers'
import { IAccount } from './IAccount';

export interface IRPC {
  account: IAccount
  getBalance(contractAddress: string)
  sendTransaction(to: string, value: number, contractAddress: string)
}