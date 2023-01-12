import {db} from '@servichain/helpers/MongooseSingleton'
import {IRPC} from '@servichain/interfaces'
import {EthersRPC} from '@servichain/helpers/rpcs/EthersRPC'
import { BitcoinRPC } from '@servichain/helpers/rpcs/BitcoinRPC'
import { EHttpStatusCode, ENetworkType } from '@servichain/enums'
import { BaseError } from './BaseError'
import { EError } from '@servichain/enums/EError'

class RPCArray {
  instances = {}

  constructor() {
    try {
      this.getInstance = this.getInstance.bind(this)
      this.getAllInstances = this.getAllInstances.bind(this)
      this.setInstance = this.setInstance.bind(this)
      db.Network.find({}).then((items) => {
        items.forEach(network => {
          this.instances[network.name] = this.setInstance(network)
        })
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.ManagerRPC, e, true)
    }
  }

  getInstance(name: string) {
    return this.instances[name]
  }

  getAllInstances() {
    return this.instances
  }

  setInstance(network): IRPC {
    try {
      let rpc: IRPC
      switch (network.type) {
        case ENetworkType.evm:
          rpc = new EthersRPC(network)
          break;
        case ENetworkType.bitcoin:
          rpc = new BitcoinRPC(network)
          break;
        default:
          rpc = new EthersRPC(network)
      }
      return rpc
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.ManagerRPC, e, true)
    }
  }
}

export const rpcs = new RPCArray()