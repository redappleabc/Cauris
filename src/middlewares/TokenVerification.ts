import { EHttpStatusCode, ETokenType } from "@servichain/enums";
import { BaseError } from "@servichain/helpers/BaseError";
import { ValidationService } from "@servichain/modules/validations";
import { NextFunction, Request, Response } from "express";

export function validationMiddleware(type: ETokenType) {
  if (!type)
    throw new BaseError(EHttpStatusCode.InternalServerError, "Token type was not provided in validation middleware")
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.params.id || !req.query.token)
        throw new BaseError(EHttpStatusCode.BadRequest, "Querystring or Params were not provided")
      const service = new ValidationService()
      let token = await service.verifyToken(req.query.token as string, req.params.id)
      if (token.type != type)
        throw new BaseError(EHttpStatusCode.BadRequest, "Invalid token type")
      await service.consumeToken(token)
      next()
    } catch(err) {
      next(err)
    }
  }
}