import Controller from '@servichain/helpers/controllers/Controller'
import Service from '@servichain/helpers/services/Service'
import CoinService from '@servichain/modules/coins/coin.service'

class CoinController extends Controller {
  constructor(service: Service) {
    super(service)
  }
}

export default new CoinController(CoinService)