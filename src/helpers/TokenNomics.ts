import Nomics, { IRawCurrencyTicker } from "nomics"
import config from "config"
import { ITokenExplorer } from "@servichain/interfaces/ITokenExplorer"
import { ICoin } from "@servichain/interfaces"
import { EHttpStatusCode } from "@servichain/enums"
import { BaseError } from "./BaseError"

const Detailed = {
    vituals: true,
    versionKey: false,
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
      return ret
    }  
}

export class TokenNomics implements ITokenExplorer {
    service: Nomics
    constructor() {
        if (config.has('secrets.nomics')) {
            this.service = new Nomics({
                apiKey: config.get('secrets.nomics')
            })
        } else this.service = null
    }

    private async getServiceData(ids: string[], currency: string) {
        let data = await this.service.currenciesTicker({
            interval: ['1d'],
            ids,
            convert: currency
        })
        if (!data) {
          throw new BaseError(EHttpStatusCode.InternalServerError, "Could not retrieve coins infos")
        }
        return data
    }

    async getCoin(coin: ICoin, currency: string = 'USD') {
        let ids: string[] = [coin.symbol.toUpperCase()]
        let nomicsData: IRawCurrencyTicker[] = await this.getServiceData(ids, currency)
        coin = (coin as any).toObject(Detailed)
        coin['price'] = nomicsData[0] ? nomicsData[0] : "0.00000000"
        coin['price_currency'] = currency
        if (!coin['logo'])
            coin['logo'] = nomicsData[0]?.logo_url
        return coin
    }

    async getCoins(coins: ICoin[], currency: string = 'USD') {
        let ids: string[] = coins.map(coin => coin.symbol.toUpperCase())
        let nomicsData: IRawCurrencyTicker[] = await this.getServiceData(ids, currency)
        coins.forEach((element: ICoin, i: number, items: any[]) => {
            items[i] = items[i].toObject(Detailed)
            let match = nomicsData.filter((item: IRawCurrencyTicker) => item.symbol === element.symbol)
            items[i]['price'] = match[0] ? match[0].price : "0.00000000"
            items[i]['price_currency'] = currency
            if (!items[i]['logo'])
                items[i]['logo'] = match[0]?.logo_url
        })
        return coins
    }

    async ping() {
        this.service.currenciesTicker()
    }
}