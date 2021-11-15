import {HDWallet} from '@servichain/helpers/hdwallets/HDWallet'
import * as bitcoin from 'bitcoinjs-lib'

export class BitcoinWallet extends HDWallet {
  constructor(mnemonic: string) {
    super(mnemonic)
  }

  generatePublicKey(childrenNode: bitcoin.BIP32Interface): string{
    return childrenNode.publicKey.toString('hex')
  }

  generatePrivateKey(childrenNode: bitcoin.BIP32Interface): string {
    return childrenNode.toWIF()
  }

  getAddress(childrenNode: bitcoin.BIP32Interface): string {
    return bitcoin.payments.p2pkh({
      pubkey: childrenNode.publicKey
    }).address
  }
}