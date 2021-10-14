import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'
import { BaseError } from '../../helpers/BaseError'
import generateRandomToken from '../../helpers/randomToken'
import config from 'config'
import JwtHelper from '../../middlewares/JwtHelper'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'
import { EHttpStatusCode } from '../../enums/EHttpError'

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