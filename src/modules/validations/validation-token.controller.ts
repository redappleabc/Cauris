import { ServiceProtected } from '@servichain/helpers/services'
import { ControllerProtected } from '@servichain/helpers/controllers/ControllerProtected'
import { NextFunction, Request, Response } from 'express'
import { IResponseHandler } from '@servichain/interfaces';
import { ValidationService } from './validation-token.service';
import { BaseError } from '@servichain/helpers/BaseError';
import { EHttpStatusCode } from '@servichain/enums';
import { ValidResponse } from '@servichain/helpers/responses';

export class ValidationController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.generateToken = this.generateToken.bind(this)
  }

  public async generateToken(req: Request, res: Response, next: NextFunction) {
    try {
      let {tokenType, email} = req.body;
      const handler: IResponseHandler = await (this.service as ValidationService).generateToken(tokenType, email);
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }
}