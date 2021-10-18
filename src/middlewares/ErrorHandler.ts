import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "@servichain/helpers/responses/ErrorResponse";
import { BaseError } from '@servichain/helpers/BaseError'

export async function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  const handler = new ErrorResponse(err)
  return handler.handleResponse(res)
}

export async function isOperationalError(err: Error) {
  if (err instanceof BaseError)
    return err.isOperational
  else
    return false
}

process.on('uncaughtException', err => {
  if (!isOperationalError(err))
    process.exit(1)
})

process.on('unhandledRejection', err => {
  throw err
})