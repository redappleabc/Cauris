import { BIP32Interface } from "bip32";

export interface IHDWallet {
  mnemonic: string
  seed: string
  hdMaster: BIP32Interface

  generateMasterNode(coinIndex: number)
  generateKeyPair(coinIndex: number, account_index: number, change: number, address_index: number)
  generatePublicKey(childrenNode: BIP32Interface): string
  generatePrivateKey(childrenNode: BIP32Interface): string
  getAddress(childrenNode: BIP32Interface): string
}