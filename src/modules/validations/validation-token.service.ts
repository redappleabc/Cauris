import { EHttpStatusCode, ETokenType } from '@servichain/enums'
import db from '@servichain/helpers/MongooseClient'
import { generateRandomToken } from '@servichain/helpers/randomToken'
import { ServiceProtected } from '@servichain/helpers/services'
import { IResponseHandler } from '@servichain/interfaces'
import { Model } from 'mongoose'
import config from 'config'
import { BaseError } from '@servichain/helpers/BaseError'

export class ValidationService extends ServiceProtected {
  constructor(model: Model<any> = db.ValidationToken) {
    super(model)
  }

  public async generateToken(type: ETokenType, user: any): Promise<IResponseHandler> {
    var token = generateRandomToken()
    var data = {
      user,
      token,
      type,
      expiresIn: config.get('validationTokenExpiresIn')
    }
    return super.insert(data)
  }

  public async verifyToken(tokenString: string, user: any) {
    try {
      let token = await this.model.findOne({user, token: tokenString})
      if (!token)
        throw new BaseError(EHttpStatusCode.NotFound, "The provided token wasn't found or does not belong to this user")
      if (token.isExpired)
        throw new BaseError(EHttpStatusCode.BadRequest, "This token has expired")
      if (token.used)
        throw new BaseError(EHttpStatusCode.BadRequest, "This token has already been used")
      return token
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error has occured")
    }
  }

  public async consumeToken(token: any) {
    try {
      token.used = true
      token.save()
      return true
    } catch(err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error has occured")
    }
  }
}