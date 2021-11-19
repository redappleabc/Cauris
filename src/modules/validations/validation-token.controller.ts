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
  }

  public async generateToken(req: Request, res: Response, next: NextFunction) {
    try {
      let {tokenType} = req.body;
      const handler: IResponseHandler = await (this.service as ValidationService).generateToken(tokenType, req.user)
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      let {token} = req.query
      if (!token)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid querystring")
      await (this.service as ValidationService).verifyToken(token as string, req.user)
      return new ValidResponse(EHttpStatusCode.OK, "Token is valid")
    } catch (err) {
      next(err)
    }
  }
}