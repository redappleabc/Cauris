export enum EHttpStatusCode {
  // Success
  OK = 200,
  Created = 201,
  Accepted = 202,
  // Redirections
  MultiplesChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  TooManyRedirects = 310,
  // Client Error
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  ImATeapot = 418,
  // Server Error
  InternalServerError = 500
}