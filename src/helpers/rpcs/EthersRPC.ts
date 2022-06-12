import { IAccount, ICoin, INetwork, IRPC } from '@servichain/interfaces'
import * as ethers from 'ethers'
import {abi} from '@servichain/files/test-token.json'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import config from 'config'
import { ScanHelper } from '../ScanHelper'
import { ParaSwapHelper } from '../ParaSwapHelper'
import { APIError, NetworkID, Transaction } from 'paraswap'
import { OptimalRate } from "paraswap-core";
import { ITxBody } from '@servichain/interfaces/ITxBody'
export class EthersRPC implements IRPC {
  account: IAccount
  provider: ethers.providers.JsonRpcProvider
  scan: ScanHelper
  paraswap: ParaSwapHelper
  wallet: ethers.Wallet

  constructor(network: INetwork) {
    const {rpcUrl, apiUrl, chainId, configKey = null} = network
    if (config.has(`rpc.${configKey}`)) {
      const options: any = config.get(`rpc.${configKey}`)
      this.provider = new ethers.providers.JsonRpcProvider({url: rpcUrl, ...options}, chainId)
    } else
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
    this.scan =  new ScanHelper(apiUrl, config.get(`api.${configKey}`))
    this.paraswap = new ParaSwapHelper(chainId as NetworkID)
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

  public async getSwapPrice(src: ICoin, dest: ICoin, value: string) {
    let bignum = ethers.utils.parseUnits(value, src.decimals)
    let priceRoute = (await this.paraswap.getPrices(src.symbol, dest.symbol, bignum.toString())) as OptimalRate
    
    return priceRoute
  }

  public async hasAllowance(to: string, value: string | ethers.BigNumber, coin: ICoin) {
    const {contractAddress = null} = coin

    if (!!contractAddress) {
      var contract = new ethers.Contract(contractAddress, abi, this.wallet)
      var allowance = await contract.allowance(this.account.address, to)
      if (ethers.BigNumber.from(allowance).lt(value)) {
        return false
      } else return true
    }
    return true
  }

  public async approve(to: string, value: string | ethers.BigNumber, coin: ICoin) {
    const {contractAddress = null} = coin

    if (!!contractAddress) {
      if (typeof value === 'string')
        value = ethers.BigNumber.from(value)
  
      var allowed = await this.hasAllowance(to, value, coin)
      if (!allowed) {
        var contract = new ethers.Contract(contractAddress, abi, this.wallet)
        var txRes = await contract.approve(to, value)
        return await txRes.wait()
      }
    } return null
  }

  public async buidSwapTx(priceRoute: OptimalRate) {
    try {
      const swapTxRaw = await this.paraswap.getTx(priceRoute, this.account.address)
  
      if ((swapTxRaw as APIError).status === EHttpStatusCode.BadRequest)
      throw new BaseError(EHttpStatusCode.BadRequest, (swapTxRaw as APIError).message)
      let swapTx = {
        to: swapTxRaw['to'],
        value: ethers.BigNumber.from(swapTxRaw['value']),
        data: swapTxRaw['data'],
        gasPrice: ethers.BigNumber.from(swapTxRaw['gasPrice'])
      }
      return swapTx
    }catch (err) { throw new BaseError(EHttpStatusCode.InternalServerError, "Json RPC : " + err)}
  }

  public async swap(txSwap: ITxBody) {
    try {
      const tx = await this.wallet.sendTransaction(txSwap)
      return tx.hash
    } catch (err) {
      new BaseError(EHttpStatusCode.InternalServerError, "Json RPC : " + err.reason)
    }
  }

  public async estimate(tx: ITxBody, coin: ICoin, call: string = 'transfer') {
    const signer = this.provider.getSigner(this.account.address)
    const {contractAddress = null} = coin
    tx.value = ethers.utils.parseUnits(tx.value as string, coin.decimals)
    let estimateGas: ethers.BigNumber
    if (!!contractAddress) {
      var contract = new ethers.Contract(contractAddress, abi, signer)
      estimateGas = (tx.data) ? 
      await contract.estimateGas[call](tx.to, tx.value, tx.data) :
      await contract.estimateGas[call](tx.to, tx.value)
    } else {
      estimateGas = await this.provider.estimateGas(tx)
      if (!estimateGas)
        throw new BaseError(EHttpStatusCode.InternalServerError, "An error occured while trying to estimate " + call)
    }
    return this.calculateFeesFromBigNum(estimateGas)
  }

  public async transfer(tx: ITxBody, coin: ICoin) {
    const {contractAddress = null} = coin
    tx.value = ethers.utils.parseUnits(tx.value as string, coin.decimals)
    tx.gasPrice = await (await this.parseGasScan()).gasPrice
    const {to, value, gasPrice} = tx
    var txRes: any
    if ((await this.getBalance(contractAddress)).lt(value))
      throw new BaseError(EHttpStatusCode.BadRequest, "Your balance is insufficient to perform this transaction")
    try {
      if (!!contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, this.wallet)
        txRes = await contract.transfer(to, value, {gasPrice})
      } else {
        txRes = await this.wallet.sendTransaction(tx)
      }
      return txRes.hash
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }
}