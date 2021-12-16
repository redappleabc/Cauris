import { INetwork } from './INetwork'

export interface ICoin {
  id?: string
  network: string | INetwork
  coinIndex: number
  name: string
  symbol: string
  contractAddress?: string
  createdAt?: Date
  price?: Object
  logo?: string
}