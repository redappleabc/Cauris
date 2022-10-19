import { ICoin } from ".";

export interface ITokenExplorer {
    service: any
    getCoin(coin: ICoin, currency?: string)
    getCoins(coin: ICoin[], currency?: string)
    ping()
}