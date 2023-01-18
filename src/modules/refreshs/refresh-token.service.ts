import {db} from '@servichain/helpers/MongooseSingleton'
import { ServiceProtected } from '@servichain/helpers/services'
import { isValidObjectId, Model } from 'mongoose'
import { BaseError } from '@servichain/helpers/BaseError'
import {generateRandomToken} from '@servichain/helpers/randomToken'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EHttpStatusCode } from '@servichain/enums'
import config from 'config'
import IRefresh from '@servichain/interfaces/IRefresh'
import { IUser } from '@servichain/interfaces'
import { EError } from '@servichain/enums/EError'

const refreshTokenExpiresIn: number = config.get('tokens.refreshExpiresIn')

export class RefreshService extends ServiceProtected {
  constructor(model: Model<any> = db.RefreshToken) {
    super(model, "[Refresh Service]")
    this.refresh = this.refresh.bind(this)
    this.generate = this.generate.bind(this)
  }

  public async refresh(token: any, ipAddress: string) {
    try {
      const refreshToken: IRefresh = await this.model.findOne(token.id)
      if (!refreshToken)
        throw new BaseError(EHttpStatusCode.NotFound, EError.TokenRefreshFailed)
      const { user }: IRefresh = refreshToken
  
      const newToken = await this.generate(((user as IUser).id as string), ipAddress)
      refreshToken.replacedByToken = newToken.token
      this.revoke(refreshToken, ipAddress)
      await this.model.create(newToken)
      const {jwtToken} = JwtHelper.generate(user)
  
      return new ValidResponse(200, {user, jwtToken, refreshToken: newToken})
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async generate(id: string, ipAddress: string) {
    try {
      if (isValidObjectId(id) === false)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoInvalidID)
      const refreshToken: any = {
        user: id,
        token: generateRandomToken(40),
        expires: new Date(Date.now() + refreshTokenExpiresIn),
        createdByIp: ipAddress
      }
      return refreshToken
    } catch(e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline + this.name, e, true)
    }
  }

  public async revoke(token, ipAddress) {
    token.revoked = new Date(Date.now())
    token.revokedByIp = ipAddress
    await token.save()
  }
}