import ethers from 'ethers'
import { IAccount } from './IAccount';

export interface IRPC {
  account: IAccount
  setWallet(account:any)
  getBalance(contractAddress: string)
  sendTransaction(to: string, value: any, contractAddress: string, handleInsert: (d)=>{}, insertBody: any)
  getHistory(contractAddress: string, page: number)
  getGasFees()
}