import ethers from 'ethers'
import { ICoin } from '.';
import { IAccount } from './IAccount';
import { ITxBody } from './ITxBody';

export interface IRPC {
  account: IAccount
  setWallet(account:any)
  getBalance(contractAddress: string)
  getHistory(address: string, coin: ICoin, page: number)
  estimate(tx: ITxBody, coin: ICoin)
  transfer(tx: ITxBody, coin: ICoin)
}