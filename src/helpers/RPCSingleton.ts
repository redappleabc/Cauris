import {db} from '@servichain/helpers/MongooseSingleton'
import {IRPC} from '@servichain/interfaces'
import {EthersRPC} from '@servichain/helpers/rpcs/EthersRPC'
import { ENetworkType } from '@servichain/enums'

class RPCArray {
  instances = {}

  constructor() {
    this.getInstance = this.getInstance.bind(this)
    this.getAllInstances = this.getAllInstances.bind(this)
    this.setInstance = this.setInstance.bind(this)
    db.Network.find({}).then((items) => {
      items.forEach(network => {
        this.instances[network.name] = this.setInstance(network)
      })
    })
  }

  getInstance(name: string) {
    return this.instances[name]
  }

  getAllInstances() {
    return this.instances
  }

  setInstance(network): IRPC {
    let rpc: IRPC
    switch (network.type) {
      case ENetworkType.evm:
        rpc = new EthersRPC(network)
      default:
        rpc = new EthersRPC(network)
    }
    console.log("network " + network.name + " is instanciated")
    return rpc
  }
}

export const rpcs = new RPCArray()