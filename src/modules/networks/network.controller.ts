import Controller from '@servichain/helpers/controllers/Controller'
import Service from '@servichain/helpers/services/Service'
import NetworkService from '@servichain/modules/networks/network.service'

class NetworkController extends Controller {
  constructor(service: Service) {
    super(service)
  }
}

const service = new NetworkService()

export default new NetworkController(service)