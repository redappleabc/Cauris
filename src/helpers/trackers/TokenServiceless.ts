import { ICoin } from "@servichain/interfaces"
import { ITokenExplorer } from "@servichain/interfaces/ITokenExplorer"

const Detailed = {
    vituals: true,
    versionKey: false,
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
      return ret
    }  
}

export class TokenServiceless implements ITokenExplorer {
    service: null
    constructor() {}

    async getCoin(coin: ICoin, currency: string = 'USD') {
        coin = (coin as any).toObject(Detailed)
        coin['price'] = "1.00000000"
        coin['price_currency'] = currency
        return coin
    }

    async getCoins(coins: ICoin[], currency: string = 'USD') {
        coins.forEach((element: ICoin, i: number, items: any[]) => {
            items[i] = items[i].toObject(Detailed)
            items[i]['price'] = "1.00000000"
            items[i]['price_currency'] = currency
        })
        return coins
    }

    async ping() {
        return true
    }

}