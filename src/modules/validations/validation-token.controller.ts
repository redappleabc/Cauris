import Controller from '../../helpers/Controller'
import Service from '../../helpers/Service'
import validationService from './validation-token.service'

class ValidationController extends Controller {
  constructor(service: Service) {
    super(service)
  }
}

export default new ValidationController(validationService)