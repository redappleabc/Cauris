import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "@servichain/helpers/responses/ErrorResponse";
import { BaseError } from '@servichain/helpers/BaseError'

export async function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  const handler = new ErrorResponse(err)
  return handler.handleResponse(res)
}

export async function isCriticalError(err: Error) {
  if (err instanceof BaseError)
    return err.critical
  else
    return false
}