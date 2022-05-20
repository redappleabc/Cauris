import config from 'config'
import { APIError, NetworkID, ParaSwap } from "paraswap";
import { OptimalRate } from "paraswap-core";

export class ParaSwapHelper {
    swap: ParaSwap

    constructor(chainId: NetworkID) {
        this.swap = new ParaSwap(chainId)
    }

    async getPrices(src: string, dest: string, amount: string) {
        const priceRoute: OptimalRate | APIError = await this.swap.getRate(src, dest, amount)
        return priceRoute
    }

    async getTx(srcToken: string, destToken: string, priceRoute: OptimalRate, address: string) {
        let {srcAmount, destAmount} = priceRoute
        let partnerFeeBps = 199
        let partnerAddress: string

        if (config.has(`wallet.address`))
            partnerAddress = config.get(`wallet.address`)
        else
            partnerAddress = "0x6705743ca5bD1c89c633751F90A5C01927919ba8"
        return await this.swap.buildTx(
            srcToken, 
            destToken, 
            srcAmount, 
            destAmount, 
            priceRoute, 
            address,
            undefined,
            partnerAddress,
            partnerFeeBps
        )
    }
}