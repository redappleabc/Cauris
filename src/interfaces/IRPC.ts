import ethers from 'ethers'
import { ICoin } from '.';
import { IAccount } from './IAccount';

export interface IRPC {
  account: IAccount
  setWallet(account:any)
  getBalance(contractAddress: string)
  sendTransaction(to: string, rawValue: any, coin: ICoin)
  getHistory(address: string, coin: ICoin, page: number)
  estimate(to: string, rawValue: any, coin: ICoin)
}