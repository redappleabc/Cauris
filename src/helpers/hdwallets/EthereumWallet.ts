import {HDWallet} from '@servichain/helpers/hdwallets/HDWallet'
import { BIP32Interface } from 'bip32'
import * as ethereum from 'ethereumjs-util'

export class EthereumWallet extends HDWallet {
  constructor(mnemonic: string) {
    super(mnemonic)
  }

  generatePublicKey(childrenNode: BIP32Interface): string {
    const keystring: string = childrenNode?.publicKey?.toString('hex')
    return ethereum.toChecksumAddress("0x" + keystring)
  }

  generatePrivateKey(childrenNode: BIP32Interface): string {
    const keystring: string = childrenNode?.privateKey?.toString('hex')
    return ethereum.toChecksumAddress("0x" + keystring)
  }

  getAddress(childrenNode: BIP32Interface): string {
    const privKeyBuffer: Buffer = childrenNode?.privateKey
    const pubKey = ethereum.privateToPublic(privKeyBuffer)
    const addr = "0x" + ethereum.publicToAddress(pubKey).toString('hex')
    return ethereum.toChecksumAddress(addr)
  }
}