import Controller from '@servichain/helpers/controllers/Controller'
import Service from '@servichain/helpers/services/Service'
import validationService from '@servichain/modules/validations/validation-token.service'

class ValidationController extends Controller {
  constructor(service: Service) {
    super(service)
  }
}

export default new ValidationController(validationService)