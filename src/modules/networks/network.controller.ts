import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import NetworkService from './network.service'

class NetworkController extends Controller {
  constructor(service: Service) {
    super(service)
  }
}

const service = new NetworkService()

export default new NetworkController(service)