import { IAccount, ICoin, INetwork, IRPC } from '@servichain/interfaces'
import * as ethers from 'ethers'
import {abi} from '@servichain/files/test-token.json'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import config from 'config'
import { ScanHelper } from '../ScanHelper'

export class EthersRPC implements IRPC {
  account: IAccount
  provider: ethers.providers.JsonRpcProvider
  scan: ScanHelper
  wallet: ethers.Wallet

  constructor(network: INetwork) {
    const {rpcUrl, apiUrl, chainId, configKey = null} = network
    if (config.has(`rpc.${configKey}`)) {
      const options: any = config.get(`rpc.${configKey}`)
      this.provider = new ethers.providers.JsonRpcProvider({url: rpcUrl, ...options}, chainId)
    } else
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
      this.scan =  new ScanHelper(apiUrl, config.get(`api.${configKey}`))
  }

  public setWallet(account:any){
    this.account = account
    this.wallet = new ethers.Wallet(account.privateKey, this.provider)
  }

  public async getBalance(contractAddress: string = null): Promise<ethers.ethers.BigNumber> {
    try {
      if (contractAddress) {
        const contract = new ethers.Contract(contractAddress, abi, this.wallet)
        const balance = await contract.balanceOf(this.account.address)
        return balance
      } else {
        const balance = await this.wallet.getBalance()
        return balance
      }
    } catch (err) {
      if (!err.reason)
        return ethers.BigNumber.from('0x00')
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }

  private calculateFees(gas: string, gasPrice: string, gasUsed: string) {
    return (
      ethers.BigNumber.from(gasPrice)
      .add(ethers.BigNumber.from(gas))
      .mul(ethers.BigNumber.from(gasUsed))
      )
  }

  private parseHistory(rawHistory: any, decimals: number) {
    let history = []
    let unparsedArray: [] = (!!rawHistory.result) ? rawHistory.result : []
    unparsedArray.forEach(item => {
      let {timeStamp, hash, to, from, value, confirmations, gas, gasPrice, gasUsed} = item
      let fees = (!!gas && !!gasPrice && !!gasUsed) ? this.calculateFees(gas, gasPrice, gasUsed) : '0'
      history.push({
        to,
        from,
        value: ethers.utils.formatUnits(
          ethers.BigNumber.from(value), 
          decimals
        ),
        status: confirmations == 0 ? 'pending' : 'success',
        timeStamp,
        confirmations,
        gasPrice,
        gasUsed,
        gas,
        fees: ethers.utils.formatUnits(fees, '18'),
        hash
      })
    })
    return history
  }

  public async getHistory(address: string, coin: ICoin, page: number = 1) {
    try {
      let history;
      if (!!coin.contractAddress)
        history = await this.scan.retrieveContractHistory(address, page, coin.contractAddress)
      else
        history = await this.scan.retrieveHistory(address, page)
      return this.parseHistory(history, coin.decimals)
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }

  public async getGasFees() {
    try {
      const {gasPrice, maxPriorityFeePerGas} = await this.provider.getFeeData()
      return (gasPrice.add(maxPriorityFeePerGas)).mul("21000")
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err)
    }
  }

  public async sendTransaction(to: string, valueStr: string, coin: ICoin) {
    const signer = this.provider.getSigner(this.account.address)
    const {contractAddress = null} = coin
    const value = ethers.utils.parseUnits(valueStr, coin.decimals)
    var tx: any
    if ((await this.getBalance(contractAddress)).lt(value))
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