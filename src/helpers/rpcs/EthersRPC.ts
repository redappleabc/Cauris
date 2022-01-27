import { IAccount, INetwork, IRPC } from '@servichain/interfaces'
import * as ethers from 'ethers'
import {abi} from '@servichain/files/test-token.json'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import config from 'config'
import io from "@servichain/app";
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

  public async getHistory(contractAddress: string = null, page: number = 1) {
    if (contractAddress)
      return await this.scan.retrieveContractHistory(this.account.address, page, contractAddress)
    else
      return await this.scan.retrieveHistory(this.account.address, page)
  }

  public async getGasFees() {
    try {
      const gasData = await this.provider.getFeeData()
      return gasData.gasPrice
    } catch (err) {
    }
  }

  public async sendTransaction(to: string, value: ethers.BigNumber, contractAddress = null, handleInsert, insertBody) {
    const signer = this.provider.getSigner(this.account.address)
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
      this.provider.on("pending", (tx) => {
        this.provider.getTransaction(tx).then(function (transaction) {
          console.log("transaction is pending",transaction);
          // io.emit("trx-pending", {transaction})
        });
      });

      this.provider.once(tx.transactionHash, (transaction) => {
        // Emitted when the transaction has been mined
        console.log("transaction has been mined success", transaction)
        io.emit("trx-mined", {transaction})
        console.log("event emitted")
    })
      return handleInsert({...insertBody, hash: tx.transactionHash})
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }
}