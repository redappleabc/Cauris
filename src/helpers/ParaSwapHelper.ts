import config from 'config'
import { BigNumber } from 'bignumber.js';
import axios from 'axios';
//import { APIError, NetworkID, ParaSwap } from "paraswap";
import { constructSimpleSDK, SDKFetchMethods, OptimalRate } from '@paraswap/sdk';
declare type NetworkID = 1 | 3 | 42 | 4 | 56 | 137 | 43114;

export class ParaSwapHelper {
    swap: SDKFetchMethods

    constructor(chainId: NetworkID) {
        this.swap = constructSimpleSDK({network: chainId, axios})
    }

    async getPrices(src: string, dest: string, amount: string) {
        const priceRoute: OptimalRate = await this.swap.getRate({srcToken:src, destToken:dest, amount:amount})
        return priceRoute
    }

    async getTx(priceRoute: OptimalRate, address: string) {
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
    }
}