export class BaseError extends Error {
  description: string
  status: number
  isOperational: boolean
  constructor(statusCode: number, message: string, isOperational: boolean = false) {
    super(message)
    this.status = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this)
  }
}