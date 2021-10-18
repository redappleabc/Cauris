import {HDWallet} from '@servichain/helpers/hdwallets/HDWallet'
import * as ethereum from 'ethereumjs-util'

export class EthereumWallet extends HDWallet {
  constructor(mnemonic: string) {
    super(mnemonic)
  }

  generateChecksumAddress(keyString: string): string {
    return ethereum.toChecksumAddress("0x" + keyString)
  }

  getAddress(privKeyBuffer: Buffer): string {
    const pubKey = ethereum.privateToPublic(privKeyBuffer)
    const addr = "0x" + ethereum.publicToAddress(pubKey).toString('hex')
    return ethereum.toChecksumAddress(addr)
  }
}