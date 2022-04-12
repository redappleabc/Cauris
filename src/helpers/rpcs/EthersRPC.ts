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

  private calculateFeesFromString(gas: string, gasPrice: string, gasUsed: string) {
    return (
      ethers.BigNumber.from(gasPrice)
      .add(ethers.BigNumber.from(gas))
      .mul(ethers.BigNumber.from(gasUsed))
    )
  }

  private async calculateGasPrice() {
    let {gasPrice, maxPriorityFeePerGas} = await this.provider.getFeeData()
    let scan = await this.parseGasScan()
    gasPrice = (scan.gasPrice != null) ? scan.gasPrice : gasPrice
    return {gasPrice, maxPriorityFeePerGas}
  }

  private async calculateFeesFromBigNum(estimateGas: ethers.BigNumber) {
    try {
      let {gasPrice, maxPriorityFeePerGas} = await this.calculateGasPrice()
      maxPriorityFeePerGas = (maxPriorityFeePerGas != null) ? maxPriorityFeePerGas : ethers.BigNumber.from('0x00')
      return (gasPrice.add(maxPriorityFeePerGas)).mul(estimateGas)
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err)
    }
  }

  private parseHistory(rawHistory: any, decimals: number) {
    let history = []
    let unparsedArray: [] = (!!rawHistory.result) ? rawHistory.result : []
    unparsedArray.forEach(item => {
      let {timeStamp, hash, to, from, value, confirmations, gas, gasPrice, gasUsed} = item
      let fees = (!!gas && !!gasPrice && !!gasUsed) ? this.calculateFeesFromString(gas, gasPrice, gasUsed) : '0'
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

  private async parseGasScan() {
    try {
      const {result} = await this.scan.getGasOracle()
      console.log(result)
      if (typeof result == 'string')
        return {
          gasPrice: null
        }
      else
        return {
          gasPrice: ethers.utils.parseUnits(result.ProposeGasPrice, "gwei")
        }
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
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

  public async estimate(to: string, rawValue: string, coin: ICoin) {
    const signer = this.provider.getSigner(this.account.address)
    const {contractAddress = null} = coin
    const value = ethers.utils.parseUnits(rawValue, coin.decimals)
    let estimateGas: ethers.BigNumber
    if (!!contractAddress) {
      var contract = new ethers.Contract(contractAddress, abi, signer)
      estimateGas = await contract.estimateGas.transfer({to, value})
    } else {
      estimateGas = await this.provider.estimateGas({to, value})
    }
    return this.calculateFeesFromBigNum(estimateGas)
  }

  public async sendTransaction(to: string, rawValue: string, coin: ICoin) {
    const signer = this.provider.getSigner(this.account.address)
    const {contractAddress = null} = coin
    const value = ethers.utils.parseUnits(rawValue, coin.decimals)
    const {gasPrice} = await this.parseGasScan()
    var tx: any
    if ((await this.getBalance(contractAddress)).lt(value))
      throw new BaseError(EHttpStatusCode.BadRequest, "Your balance is insufficient to perform this transaction")
    try {
      if (!!contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, signer)
        tx = await contract.transfer(to, value, {gasPrice})
      } else {
        tx = await this.wallet.sendTransaction({to, value, gasPrice})
      }
      return tx.hash
    } catch (err) {
      console.log(err)
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }
}
