import { EHttpStatusCode } from "@servichain/enums"
import { BaseError } from "./BaseError"

const axios = require('axios').default

export class ScanHelper {
  url: string
  apiKey: string

  constructor(url: string = "https://api.etherscan.io", apiKey: string = "9D13ZE7XSBTJ94N9BNJ2MA33VMAY2YPIRB") {
    this.url = url
    this.apiKey = apiKey
  }

  public async retrieveHistory(address: string, page: number = 1) {
    const parameters = {
      address,
      page,
      startblock: 0,
      endblock:99999999,
      offset: 15,
      sort: 'desc',
      apikey: this.apiKey
    }
    return this.makeRequest("account", "txlist", parameters)
  }

  public async retrieveContractHistory(address: string, page: number = 1, contractaddress: string) {
    const parameters = {
      address,
      page,
      contractaddress,
      startblock: 0,
      endblock:99999999,
      offset: 15,
      sort: 'desc',
      apikey: this.apiKey
    }
    return this.makeRequest("account", "tokentx", parameters)
  }

  private async makeRequest(module: string, action: string, parameters: any) {
    try {
      let res = await axios.get(`${this.url}/api`, {
        params: {
          module,
          action,
          ...parameters
      }})
      return res.data
    } catch (err) {
      return new BaseError(EHttpStatusCode.InternalServerError, "Could not request scan API")
    }
  }
}