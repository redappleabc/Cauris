import { IAccount, ICoin, IRPC } from "@servichain/interfaces";

import { INetwork } from "@servichain/interfaces";
import { ITxBody } from "@servichain/interfaces/ITxBody";
import { EHttpStatusCode } from '@servichain/enums'


import axios from "axios";

import * as bitcoin from 'bitcoinjs-lib'

import * as ecc from 'tiny-secp256k1'

import { ECPairFactory } from 'ecpair';
import { BaseError } from "../BaseError";
import { EError } from "@servichain/enums/EError";

const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.bitcoin

const testNetwork = bitcoin.networks.testnet


export class BitcoinRPC implements IRPC {
  account: IAccount
  rpcUrl: string
  chainId: number
  currencySymbol: string


  constructor(network: INetwork) {
    const { rpcUrl, chainId = 0, currencySymbol } = network
    this.rpcUrl = rpcUrl
    this.chainId = chainId
    this.currencySymbol = currencySymbol
  }

  public setWallet(account: any) {
    this.account = account
  }

  public async getBalance() {
    try {
      const balanceUrl = `${this.rpcUrl}get_address_balance/${this.currencySymbol}/${this.account.address}`
      const response = await axios.get(balanceUrl)
      return response.data.data.confirmed_balance
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline, e, true)
    }
  }


  private async getLastTxId() {
    try {
      const txUnspentUrl = `${this.rpcUrl}get_tx_unspent/${this.currencySymbol}/${this.account.address}`;
      const response = await axios.get(txUnspentUrl)
      const index = response.data.data.txs.length - 1;
      var latestTx = response.data.data.txs[index];
      const txUrl = `${this.rpcUrl}get_tx/${this.currencySymbol}/${latestTx.txid}`
      const txHex = (await axios.get(txUrl)).data.data.tx_hex
      return { ...latestTx, tx_hex: txHex }
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline)
    }

  }

  private async getTxHex(txid) {
    try {
      const txUrl = `${this.rpcUrl}get_tx/${this.currencySymbol}/${txid}`
      const txHex = (await axios.get(txUrl)).data.data.tx_hex
      return txHex
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline, e, true)
    }

  }

  public async getHistory() {
    try {
      const txSpentUrl = `${this.rpcUrl}get_tx_spent/${this.currencySymbol}/${this.account.address}`;
      const txUnspentUrl = `${this.rpcUrl}get_tx_unspent/${this.currencySymbol}/${this.account.address}`;
      const txs = [...(await axios.get(txUnspentUrl)).data.data.txs, ...(await axios.get(txSpentUrl)).data.data.txs]
      return txs
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline, e, true)
    }

  }


  public async estimate() {
    try {
      const feeUrl = 'https://bitcoinfees.earn.com/api/v1/fees/recommended';
      const response = await axios.get(feeUrl)
      const txCnt = (await this.getUnspentTransactions()).length;
      if(txCnt <= 0) return 0;
      return response.data.hourFee * ( 180 * txCnt +  34 * 2  + 10) //hourFee, fastestFee, halfHourFee
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline, e, true)
    }
  }


  private validator = (
    pubkey: Buffer,
    msghash: Buffer,
    signature: Buffer,
  ): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

  private toSatoshi(value: string) {
    return parseFloat(value) * 100000000
  }

  public async getUnspentTransactions() {
    try {
      const txUnspentUrl = `${this.rpcUrl}get_tx_unspent/${this.currencySymbol}/${this.account.address}`;
      return (await axios.get(txUnspentUrl)).data.data.txs
    }
    catch (e) {
      return []
    }
  }

  public async transfer(tx: ITxBody, coin: ICoin, _unSpentTransactions: string[] = []) {
    try {
      let { to, value } = tx;
      var satoshiValue: number = 0;
      if (typeof value === 'string')
        satoshiValue = this.toSatoshi(value)
      const latestTx = await this.getLastTxId()
      const unSpentTransactions = (await this.getUnspentTransactions())

      if (unSpentTransactions.length <= 0) {
        throw new BaseError(EHttpStatusCode.BadRequest, "You don't have unspent transactions")
      }

      const fee = await this.estimate()
      const psbt = new bitcoin.Psbt({ network: this.currencySymbol === "BTCTEST" ? testNetwork : network })

      for (let i = 0; i < unSpentTransactions.length; i++) {
        const tx = unSpentTransactions[i];
        if(_unSpentTransactions.length === 0 || _unSpentTransactions.includes(tx.txid))
          psbt.addInput({ hash: tx.txid, index: tx.output_no, nonWitnessUtxo: Buffer.from((await this.getTxHex(tx.txid)), 'hex') })
      }
      psbt.addOutput({ address: to, value: satoshiValue })
      psbt.addOutput({ address: this.account.address, value: this.toSatoshi(latestTx.value) - satoshiValue - fee })
      psbt.signInput(0, ECPair.fromWIF(this.account.privateKey));
      psbt.validateSignaturesOfInput(0);
      psbt.finalizeAllInputs();
    
      var Transaction = psbt.extractTransaction(true).toHex();
      const response = await axios.post(`${this.rpcUrl}send_tx/${this.currencySymbol}`, { tx_hex: Transaction })
      return response.data.data.txid

    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCOffline, e, true)
    }
  }
}