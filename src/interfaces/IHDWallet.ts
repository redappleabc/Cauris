import { BIP32Interface } from "bip32";

export interface IHDWallet {
  mnemonic: string
  seed: string
  hdMaster: BIP32Interface

  generateMasterNode(coinIndex: number)
  generateKeyPair(coinIndex: number, account_index: number, change: number, address_index: number)
  generateChecksumAddress(keyString: string): string
  getAddress(privKeyBuffer: Buffer): string
}