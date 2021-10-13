import { IRPC } from '../../interfaces/IRPC'
import * as ethers from 'ethers'
import { IAccount } from '../../interfaces/IAccount'
import abi from '../../../erc20.abi.json'

export class EthersRPCHelper implements IRPC {
  account: IAccount
  provider: ethers.providers.JsonRpcProvider

  constructor(url: string, chainId: number, account: any) {
    this.account = account
    this.provider = new ethers.providers.JsonRpcProvider(url, chainId)
  }

  public async getBalance(contractAddress: string = null): Promise<ethers.ethers.BigNumber> {
    if (contractAddress) {
      const contract = new ethers.Contract(contractAddress, abi, this.provider)
      const balance = await contract.balanceOf(this.account.address)
      return balance
    } else
      return await this.provider.getBalance(this.account.privateKey)
  }

  public async sendTransaction(to: string, value: number, contractAddress = null) {
    try {
      const signer = this.provider.getSigner()
      var tx: any
      if (contractAddress) {
        var contract = new ethers.Contract(contractAddress, abi, signer)
        tx = await contract.transfer(to, value)
      } else {
        tx = await signer.sendTransaction({to, value})
      }
      return tx.hash
    } catch(err) {
      throw err
    }
  }
}