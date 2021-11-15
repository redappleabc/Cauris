import { ServiceProtected } from '@servichain/helpers/services'
import { ControllerProtected } from '@servichain/helpers/controllers/ControllerProtected'

export class ValidationController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
  }
}