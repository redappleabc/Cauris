import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'
import { BaseError } from '@servichain/helpers/BaseError'
import generateRandomToken from '@servichain/helpers/randomToken'
import config from 'config'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'

const defaultExpiresIn: number = config.get('defaultExpiresIn')

class RefreshService extends Service {
  constructor(model: Model<any> = db.RefreshToken) {
    super(model)
    this.refresh = this.refresh.bind(this)
    this.generate = this.generate.bind(this)
  }

  public async refresh(token: any, ipAddress: string) {
    try {
      const refreshToken = await this.model.findOne(token.id)
      const { user } = refreshToken

      const newToken = await this.generate(user.id, ipAddress)
      refreshToken.replacedByToken = newToken.token
      this.revoke(refreshToken, ipAddress)
      this.model.create(newToken)
      const {jwtToken} = JwtHelper.generate(user)

      return new ValidResponse(200, {user, jwtToken, refreshToken: newToken})
    } catch(err) {
      throw new BaseError(EHttpStatusCode.NotFound, "Could not Refresh Token", true)
    }
  }

  public async generate(id: string, ipAddress: string) {
    try {
      const refreshToken: any = {
        user: id,
        token: generateRandomToken(),
        expires: new Date(Date.now() + defaultExpiresIn),
        createdByIp: ipAddress
      }
      return refreshToken
    } catch(err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "Could not generate refresh token", true)
    }
  }

  public async revoke(token, ipAddress) {
    token.revoked = new Date(Date.now())
    token.revokedByIp = ipAddress
    await token.save()
  }
}

export default RefreshService