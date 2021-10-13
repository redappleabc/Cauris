import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import CoinService from './coin.service'

class CoinController extends Controller {
  constructor(service: Service) {
    super(service)
  }
}

export default new CoinController(CoinService)