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

  constructor(url: string, chainId: number, configKey: string = undefined) {
    
    if (configKey) {
      const options: any = config.get(`rpc.${configKey}`)
      this.provider = new ethers.providers.JsonRpcProvider({url, ...options}, chainId)
    } else
      this.provider = new ethers.providers.JsonRpcProvider(url, chainId)
    
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

  public async sendTransaction(to: string, value: ethers.BigNumber, contractAddress = null) {
    const signer = this.provider.getSigner(this.account.address)
    var tx: any
    console.log("Send trx ======>>>>>>>>>>============>>>>>>>")
    // if ((await this.getBalance(contractAddress)).lt(value))
      // throw new BaseError(EHttpStatusCode.BadRequest, "Your balance is insufficient to perform this transaction")
    try {
      if (contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, signer)
        tx = await (await contract.transfer(to, value)).wait()
      } else {
        tx = await (await this.wallet.sendTransaction({to, value})).wait()
      }
      var url = "wss://spring-summer-dawn.quiknode.pro/052a539fcce08360221dc0bf352b5f8ac297af26/";
      var customWsProvider = new ethers.providers.WebSocketProvider(url);
      
      customWsProvider.on("pending", (tx) => {
        customWsProvider.getTransaction(tx).then(function (transaction) {
          console.log("transaction is pending",transaction);
        });
      });

      customWsProvider.once(tx.transactionHash, (transaction) => {
        // Emitted when the transaction has been mined
        console.log("transaction has been mined", transaction)
    })
    
      customWsProvider._websocket.on("error", async () => {
        console.log(`Unable to connect to .. retrying in 3s...`);
        
      });
      customWsProvider._websocket.on("close", async (code) => {
        console.log(
          `Connection lost with code ${code}! Attempting reconnect in 3s...`
        );
        customWsProvider._websocket.terminate();
      });
      return tx.transactionHash
    } catch (err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "JsonRPC : " + err.reason)
    }
  }
}