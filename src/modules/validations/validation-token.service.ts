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
import { EError } from '@servichain/enums/EError'

export class ValidationService extends ServiceProtected {
  constructor(model: Model<any> = db.ValidationToken) {
    super(model, "[Validation Service]")
  }

  public async generateToken(type: ETokenType, email: string): Promise<IResponseHandler> {
    try {
      const user = await db.User.findOne({email})
      const expiresIn: number = config.get('tokens.validationExpiresIn')
      if (!user)
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
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
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async verifyToken(tokenString: string, user: any) {
    try {
      let token = await this.model.findOne({user, token: tokenString})
      if (!token)
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty)
      if (token.isExpired)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.TokenExpired)
      if (token.used)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.TokenUsed)
      return token
    } catch (e) { 
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async consumeToken(token: any) {
    token.used = true
    token.save()
    return true
  }
}