import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import {IHDWallet} from '@servichain/interfaces'

const bip44Constant = 44

export class HDWallet implements IHDWallet {
  mnemonic: string
  seed: string
  hdMaster: bip32.BIP32Interface

  constructor(mnemonic: string = null) {
    this.mnemonic = (mnemonic) ? mnemonic : bip39.generateMnemonic()
    let seedBuffer = bip39.mnemonicToSeedSync(this.mnemonic)
    this.seed = seedBuffer.toString('hex')
    this.hdMaster = bip32.fromSeed(seedBuffer)
  }

  getWallet() {
    return {
      mnemonic: this.mnemonic,
      seed: this.seed
    }
  }

  generateMasterNode(coinIndex: number) {
    let mainNode = this.hdMaster
    .deriveHardened(bip44Constant)
    .deriveHardened(coinIndex)
    .deriveHardened(0)

    return {
      rootKey: this.hdMaster.toBase58(),
      accountExtPubKey: mainNode.neutered().toBase58(),
      accountExtPriKey: mainNode.toBase58()
    }
  }

  generateKeyPair(coinIndex: number, account_index: number = 0, change: number = 0, address_index: number = 0) {
    let childrenNode = this.hdMaster
    .deriveHardened(bip44Constant)
    .deriveHardened(coinIndex)
    .deriveHardened(account_index)
    .derive(change)
    .derive(address_index)

    return {
      publicKey: this.generateChecksumAddress(childrenNode.publicKey.toString('hex')),
      privateKey: this.generateChecksumAddress(childrenNode.privateKey.toString('hex')),
      address: this.getAddress(childrenNode.privateKey)
    }
  }

  //must be override by children
  generateChecksumAddress(keyString: string): string {
    return keyString
  }

  //must be override by children
  getAddress(privKeyBuffer: Buffer): string {
    return "0x" + privKeyBuffer.toString('hex')
  }
}