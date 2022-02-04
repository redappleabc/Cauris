import { EHttpStatusCode, ETokenType } from '@servichain/enums'
import {db} from '@servichain/helpers/MongooseSingleton'
import { generateRandomToken } from '@servichain/helpers/randomToken'
import { ServiceProtected } from '@servichain/helpers/services'
import { IResponseHandler } from '@servichain/interfaces'
import { Model } from 'mongoose'
import config from 'config'
import { BaseError } from '@servichain/helpers/BaseError'
import bcrypt, { hash } from 'bcryptjs'
import MailerHelper from '@servichain/helpers/MailerHelper'
import { verificationTemplate } from '@servichain/mails/verificationTemplate'

export class ValidationService extends ServiceProtected {
  constructor(model: Model<any> = db.ValidationToken) {
    super(model)
  }

  public async generateToken(type: ETokenType, email: string): Promise<IResponseHandler> {
    try {
      const user = await db.User.findOne({email})
      const expiresIn: number = config.get('tokens.validationExpiresIn')
      if (!user)
        throw new BaseError(EHttpStatusCode.NotFound, "Could not found any user related to this e-mail")
      var token = generateRandomToken(4)
      var mail  = verificationTemplate(token, type)
      MailerHelper.send(email, `${type} Validation`, mail)
      var data = {
        user,
        token,
        type,
        expiresIn: new Date(Date.now() + expiresIn)
      }
      return super.insert(data)
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error has occured")
    }
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