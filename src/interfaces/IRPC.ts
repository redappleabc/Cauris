import ethers from 'ethers'
import { IAccount } from './IAccount';

export interface IRPC {
  account: IAccount
  provider: ethers.providers.JsonRpcProvider
  getBalance(contractAddress: string)
  sendTransaction(to: string, value: number, contractAddress: string)
}