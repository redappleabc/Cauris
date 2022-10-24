import { ICoin } from "@servichain/interfaces";
import { ITokenExplorer } from "@servichain/interfaces/ITokenExplorer";
import { TokenNomics } from "./TokenNomics";
import { TokenServiceless } from "./TokenServiceless";

export class CurrencyManager implements ITokenExplorer{
    apis: ITokenExplorer[]
    selector: number
    service: null
    constructor() {
        this.apis = [
            new TokenNomics(),
            new TokenServiceless()
        ]
        this.selector = 0
    }

    resetSelector() {
        this.selector = 0
    }

    async ping() {
        while (await this.apis[this.selector].ping() === false) {
            if (this.selector >= this.apis.length)
                this.selector = 0
            else this.selector++
        }
        return true
    }

    async getCoin(coin: ICoin, currency?: string) {
        try {
            return await this.apis[this.selector].getCoin(coin, currency)
        } catch (e) {
            await this.ping()
            return await this.getCoin(coin, currency)
        }
    }

    async getCoins(coins: ICoin[], currency?: string) {
        try {
            return await this.apis[this.selector].getCoins(coins, currency)
        } catch (e) {
            await this.ping()
            return await this.getCoins(coins, currency)
        }
    }
}