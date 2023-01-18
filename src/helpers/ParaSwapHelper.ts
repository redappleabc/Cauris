import config from 'config'
import { BigNumber } from 'bignumber.js';
import axios from 'axios';
//import { APIError, NetworkID, ParaSwap } from "paraswap";
import { constructSimpleSDK, SDKFetchMethods, OptimalRate } from '@paraswap/sdk';
import { INetwork } from '@servichain/interfaces';
import { BaseError } from './BaseError';
import { EHttpStatusCode } from '@servichain/enums';
import { EError } from '@servichain/enums/EError';
declare type NetworkID = 1 | 3 | 42 | 4 | 56 | 137 | 43114;

export class ParaSwapHelper {
    swap: SDKFetchMethods
    claimFeeAddresses = {}

    constructor(chainId: NetworkID) {
        try {
            this.swap = constructSimpleSDK({network: chainId, axios})
            this.claimFeeAddresses[1] = "0xeF13101C5bbD737cFb2bF00Bbd38c626AD6952F7"
            this.claimFeeAddresses[56] = "0x2DF17455B96Dde3618FD6B1C3a9AA06D6aB89347"
            this.claimFeeAddresses[137] = "0x8b5cF413214CA9348F047D1aF402Db1b4E96c060"
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCParaOffline, e?.response?.data?.error, true)
        }
    }

    
    async getPrices(src: string, dest: string, amount: string) {
        try {
            const priceRoute: OptimalRate = await this.swap.getRate({srcToken:src, destToken:dest, amount:amount})
            return priceRoute
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCParaRate + ' ' + e?.response?.data?.error, e?.response?.data?.error, true)
        }
    }

    async getTx(priceRoute: OptimalRate, address: string) {
        try {
            let {srcToken, destToken, srcAmount} = priceRoute
            let partnerFeeBps = 199
            let slippage = 2.5
            let partnerAddress: string
    
            let destAmount = new BigNumber(priceRoute.destAmount)
            .times(1 - slippage / 100)
            .toFixed(0)
    
            if (config.has(`wallet.address`))
                partnerAddress = config.get(`wallet.address`)
            else
                partnerAddress = "0x7E2935FD37b5CBd15FF32a076ee7cE3bf3EC1745"
            return await this.swap.buildTx({
                srcToken, 
                destToken, 
                srcAmount, 
                destAmount, 
                priceRoute, 
                userAddress:address,
                partnerAddress,
                partnerFeeBps
            })
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.BCParaBuild + ' - ' + e?.response?.data?.error, e?.response?.data?.error, true)
        }
    }

    claimFeeAddress(network: string | INetwork) {
        return this.claimFeeAddresses[(network as INetwork).chainId]
    }
}