import { ENetworkType } from "@servichain/enums"

export interface INetwork {
  id?: string
  name: string
  chainId?: number
  rpcUrl: string
  apiUrl?: string
  explorerUrl?: string
  configKey?: string
  currencySymbol: string
  type: ENetworkType
}