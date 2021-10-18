import { Request, Response, NextFunction } from "express";
import { BaseError } from "@servichain/helpers/BaseError";
import { EHttpStatusCode } from "@servichain/enums/EHttpError";

export function sameUserMiddleware(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params
  if (id != req.user['id']) {
    throw new BaseError(EHttpStatusCode.Unauthorized, "Unauthorized")
  }
  next()
}