import { IAccount, ICoin, IRPC } from "@servichain/interfaces";

import { INetwork } from "@servichain/interfaces";
import { ITxBody } from "@servichain/interfaces/ITxBody";

import axios from "axios";

import * as bitcoin from 'bitcoinjs-lib'

import * as ecc from 'tiny-secp256k1'

import { ECPairFactory } from 'ecpair';

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
    const balanceUrl = `${this.rpcUrl}get_address_balance/${this.currencySymbol}/${this.account.address}`
    const response = await axios.get(balanceUrl)
    console.log(response.data.data.confirmed_balance)
    return response.data.data.confirmed_balance
  }


  private async getLastTxId() {
    const txUnspentUrl = `${this.rpcUrl}get_tx_unspent/${this.currencySymbol}/${this.account.address}`;
    const response = await axios.get(txUnspentUrl)
    const index = response.data.data.txs.length - 1;
    var latestTx = response.data.data.txs[index];
    const txUrl = `${this.rpcUrl}get_tx/${this.currencySymbol}/${latestTx.txid}`
    const txHex = (await axios.get(txUrl)).data.data.tx_hex
    return { ...latestTx, tx_hex: txHex }
  }

  public async getHistory() {
    const txSpentUrl = `${this.rpcUrl}get_tx_spent/${this.currencySymbol}/${this.account.address}`;
    const txUnspentUrl = `${this.rpcUrl}get_tx_unspent/${this.currencySymbol}/${this.account.address}`;

    const txs = [...(await axios.get(txUnspentUrl)).data.data.txs, ...(await axios.get(txSpentUrl)).data.data.txs]
    return txs
  }


  public async estimate() {
    const feeUrl = 'https://bitcoinfees.earn.com/api/v1/fees/recommended';
    const response = await axios.get(feeUrl)
    return response.data.fastestFee
  }


  private validator = (
    pubkey: Buffer,
    msghash: Buffer,
    signature: Buffer,
  ):boolean  => ECPair.fromPublicKey(pubkey).verify(msghash, signature);


  private toSatoshi(value: string){
    return parseFloat(value) * 100000000
  }
  public async transfer(tx: ITxBody, coin: ICoin) {

    let {to, value} = tx;
    var satoshiValue:number = 0;
    if (typeof value === 'string')
      satoshiValue = this.toSatoshi(value)

    const latestTx = await this.getLastTxId()

    const fee = await this.estimate()

    const psbt = new bitcoin.Psbt({ network: this.chainId?testNetwork: network })


    psbt.addInput({ hash: latestTx.txid, index: latestTx.output_no, nonWitnessUtxo: Buffer.from(latestTx.tx_hex, 'hex') })

    psbt.addOutput({ address: to, value: satoshiValue })
    psbt.addOutput({ address: this.account.address, value: this.toSatoshi(latestTx.value) - satoshiValue - fee})

    psbt.signInput(0, ECPair.fromWIF(this.account.privateKey));
    psbt.validateSignaturesOfInput(0);
    psbt.finalizeAllInputs();

    var Transaction = psbt.extractTransaction(true).toHex();
    
    // var Sendingoptions = {
    //     method: 'POST', url: `${this.rpcUrl}send_tx/${this.currencySymbol}`,
    //     body: { tx_hex: Transaction }, json: true
    // };

    const response = await axios.post(`${this.rpcUrl}send_tx/${this.currencySymbol}`, {tx_hex: Transaction})

    const Jresponse = JSON.stringify(response)

    console.log("Transaction ID:\n"+Jresponse);
    
    return response.data.txid

  }

}