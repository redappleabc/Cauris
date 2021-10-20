import { ServiceProtected } from '@servichain/helpers/services'
import { ControllerProtected } from '@servichainhelpers/controllers/ControllerProtected'

export class ValidationController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
  }
}