import {HDWallet} from './HDWallet'
import * as ethereum from 'ethereumjs-util'

export class EthereumWallet extends HDWallet {
  constructor(mnemonic: string) {
    super(mnemonic)
  }

  generateChecksumAddress(keyString: string): string {
    console.log(keyString)
    return ethereum.toChecksumAddress("0x" + keyString)
  }

  getAddress(privKeyBuffer: Buffer): string {
    const pubKey = ethereum.privateToPublic(privKeyBuffer)
    console.log(privKeyBuffer)
    const addr = "0x" + ethereum.publicToAddress(pubKey).toString('hex')
    console.log(pubKey)
    console.log(addr)
    return ethereum.toChecksumAddress(addr)
  }
}