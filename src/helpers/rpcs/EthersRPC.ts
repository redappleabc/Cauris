import { IAccount, ICoin, INetwork, IRPC } from '@servichain/interfaces'
import * as ethers from 'ethers'
import { abi } from '@servichain/files/test-token.json'
import paraswapAbi from '@servichain/files/paraswap-claimfee.json'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import config from 'config'
import { ScanHelper } from '../ScanHelper'
import { ParaSwapHelper } from '../ParaSwapHelper'
import { OptimalRate } from "@paraswap/sdk";
import { ITxBody } from '@servichain/interfaces/ITxBody'
import { genSalt } from 'bcryptjs'
import { EError } from '@servichain/enums/EError'
declare type NetworkID = 1 | 3 | 42 | 4 | 56 | 137 | 43114;
export class EthersRPC implements IRPC {
  account: IAccount
  provider: ethers.providers.JsonRpcProvider
  scan: ScanHelper
  paraswap: ParaSwapHelper
  wallet: ethers.Wallet
  name: string

  constructor(network: INetwork) {
    try {
      const { name, rpcUrl, apiUrl, chainId, configKey = null } = network
      this.name = name
      if (config.has(`rpc.${configKey}`)) {
        const options: any = config.get(`rpc.${configKey}`)
        this.provider = new ethers.providers.JsonRpcProvider({ url: rpcUrl, ...options }, chainId)
      } else
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
      this.scan = new ScanHelper(apiUrl, config.get(`api.${configKey}`))
      this.paraswap = new ParaSwapHelper(chainId as NetworkID)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
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
    let { gasPrice, maxPriorityFeePerGas } = await this.provider.getFeeData()
    let scan = await this.parseGasScan()
    gasPrice = (scan.gasPrice != null) ? scan.gasPrice : gasPrice
    return { gasPrice, maxPriorityFeePerGas }
  }

  private async calculateFeesFromBigNum(estimateGas: ethers.BigNumber) {
    let { gasPrice, maxPriorityFeePerGas } = await this.calculateGasPrice()
    maxPriorityFeePerGas = (maxPriorityFeePerGas != null) ? maxPriorityFeePerGas : ethers.BigNumber.from('0x00')
    return (gasPrice.add(maxPriorityFeePerGas)).mul(estimateGas)
  }

  private parseHistory(rawHistory: any, decimals: number) {
    let history = []
    let unparsedArray: [] = (!!rawHistory.result) ? rawHistory.result : []
    unparsedArray.forEach(item => {
      let { timeStamp, hash, to, from, value, confirmations, gas, gasPrice, gasUsed } = item
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
    const { result } = await this.scan.getGasOracle()
    if (typeof result == 'string')
      return {
        gasPrice: null
      }
    else
      return {
        gasPrice: ethers.utils.parseUnits(result.ProposeGasPrice, "gwei")
      }
  }

  public setWallet(account: any) {
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
    } catch (e) {
      if (!e.reason)
        return ethers.BigNumber.from('0x00')
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
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
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async getSwapPrice(src: ICoin, dest: ICoin, value: string) {
    try {
      let bignum = ethers.utils.parseUnits(value, src.decimals)
      let priceRoute = (await this.paraswap.getPrices(src.symbol, dest.symbol, bignum.toString())) as OptimalRate
      return priceRoute
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  /**
 * @deprecated
 * Use isAllowanced, instead of this.
 */
  public async hasAllowance(to: string, value: string | ethers.BigNumber, coin: ICoin) {
    const { contractAddress = null } = coin

    if (!!contractAddress) {
      var contract = new ethers.Contract(contractAddress, abi, this.wallet)
      var allowance = await contract.allowance(this.account.address, to)
      if (ethers.BigNumber.from(allowance).lt(value)) {
        return false
      } else return true
    }
    return true
  }

  public async isAllowanced(to: string, value: string | ethers.BigNumber, contractAddress: string) {
    try {
      if (!contractAddress) return true
      var contract = new ethers.Contract(contractAddress, abi, this.wallet)
      var allowance = await contract.allowance(this.account.address, to)
      if (ethers.BigNumber.from(allowance).lt(value)) {
        return false
      } else return true
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async approve(to: string, value: string | ethers.BigNumber, contractAddress: string) {
    try {
      if (!!contractAddress) {
        if (typeof value === 'string')
          value = ethers.BigNumber.from(value)
        var allowed = await this.isAllowanced(to, value, contractAddress)
        if (!allowed) {
          var contract = new ethers.Contract(contractAddress, abi, this.wallet)
          var txRes = await contract.approve(to, value)
          return await txRes.wait()
        }
        return allowed
      } return null
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async buidSwapTx(priceRoute: OptimalRate) {
    try {
      let swapTxRaw;
      swapTxRaw = await this.paraswap.getTx(priceRoute, this.account.address)
      const bnValue = ethers.BigNumber.from(swapTxRaw['value'])
      const { gas = null, ...swapTx } = { ...swapTxRaw, gasLimit: swapTxRaw.gas, value: ethers.utils.formatUnits(bnValue, priceRoute.srcDecimals) }
    return swapTx
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async swap({ decimals }: ICoin, txSwap: ITxBody) {
    try {
      if (typeof txSwap.value === 'string')
        txSwap.value = ethers.utils.parseUnits(txSwap.value, decimals)
      if (!txSwap.gasPrice)
        txSwap.gasPrice = (await this.parseGasScan()).gasPrice
      else if (typeof txSwap.gasPrice === 'string')
        txSwap.gasPrice = ethers.BigNumber.from(txSwap.gasPrice)
      if (!txSwap.gasLimit)
        txSwap.gasLimit = ethers.BigNumber.from("300000")
      else
        txSwap.gasLimit = ethers.BigNumber.from(txSwap.gasLimit)
      let tx;
      tx = await this.wallet.sendTransaction(txSwap)    
      return tx.hash
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async estimate(tx: ITxBody, coin: ICoin, call: string = 'transfer') {
    try {
      const signer = this.provider.getSigner(this.account.address)
      const { contractAddress = null } = coin
      if (typeof tx.value === 'string')
        tx.value = ethers.utils.parseUnits(tx.value, coin.decimals)
      if (typeof tx.gasPrice === 'string')
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice)
      let estimateGas: ethers.BigNumber
      if (!!contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, signer)
        delete tx.data
        estimateGas = await contract.estimateGas[call](tx.to, tx.value)
      } else {
        delete tx.data
        estimateGas = await this.provider.estimateGas(tx)
        if (!estimateGas)
          throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCEstimation + call + this.name)
      }
      return this.calculateFeesFromBigNum(estimateGas)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async transfer(tx: ITxBody, coin: ICoin, _unSpentTransactions: string[] = []) {
    try {
      const { contractAddress = null } = coin
      if (typeof tx.value === 'string')
        tx.value = ethers.utils.parseUnits(tx.value, coin.decimals)
      if (!tx.gasPrice)
        tx.gasPrice = (await this.parseGasScan()).gasPrice
      else if (typeof tx.gasPrice === 'string')
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice)
      const { to, value, gasPrice } = tx
      var txRes: any
      if ((await this.getBalance(contractAddress)).lt(value))
        throw new BaseError(EHttpStatusCode.BadRequest, EError.BCBalance)
      if (!!contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, this.wallet)
        txRes = await contract.transfer(to, value, { gasPrice })
      } else {
        txRes = await this.wallet.sendTransaction(tx)
      }
      return txRes.hash
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async claimFee(coin: ICoin) {
    try {
      let { contractAddress:coinAddress = null, network } = coin
  
      if (!coinAddress)
        coinAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      var contractAddress = this.paraswap.claimFeeAddress(network)
      var contract = new ethers.Contract(contractAddress, paraswapAbi, this.wallet)
  
      const gasPrice = (await this.parseGasScan()).gasPrice
      const txRes = await contract.withdrawAllERC20(coinAddress, this.account.address, {gasPrice, gasLimit: ethers.BigNumber.from("300000")})
      return txRes.hash
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }

  public async claimFeeEstimate(coin: ICoin) {
    try {
      let { contractAddress:coinAddress = null, network } = coin
  
      if (!coinAddress)
        coinAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      var contractAddress = this.paraswap.claimFeeAddress(network)
  
      const signer = this.provider.getSigner(this.account.address)
      var contract = new ethers.Contract(contractAddress, paraswapAbi, signer)
      const balance = await contract.getBalance(coinAddress, this.account.address)
      return balance
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline + this.name, e, true)
    }
  }
}