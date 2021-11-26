import { IAccount, IRPC } from '@servichain/interfaces'
import * as ethers from 'ethers'
import {abi} from '@servichain/files/test-token.json'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import config from 'config'

export class EthersRPC implements IRPC {
  account: IAccount
  provider: ethers.providers.JsonRpcProvider
  wallet: ethers.Wallet

  constructor(url: string, chainId: number, account: any, configKey: string = undefined) {
    this.account = account
    if (configKey) {
      const options: any = config.get(`rpc.${configKey}`)
      this.provider = new ethers.providers.JsonRpcProvider({url, ...options}, chainId)
    } else
      this.provider = new ethers.providers.JsonRpcProvider(url, chainId)
    this.wallet = new ethers.Wallet(account.privateKey, this.provider)
  }

  public async getBalance(contractAddress: string = null): Promise<ethers.ethers.BigNumber> {
    try {
      if (contractAddress) {
        const contract = new ethers.Contract(contractAddress, abi, this.wallet)
        const balance = await contract.balanceOf(this.account.address)
        return balance
      } else
        return await this.wallet.getBalance()
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }

  public async sendTransaction(to: string, value: number, contractAddress = null) {
    const signer = this.provider.getSigner(this.account.address)
    var tx: any

    if (await this.getBalance(contractAddress) < (value as any))
      throw new BaseError(EHttpStatusCode.BadRequest, "Your balance is insufficient to perform this transaction")
    try {
      if (contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, signer)
        tx = await (await contract.transfer(to, value)).wait()
      } else {
        tx = await (await this.wallet.sendTransaction({to, value})).wait()
      }
      return tx.transactionHash
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }
}