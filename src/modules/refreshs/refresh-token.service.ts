import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'
import generateRandomToken from '../../helpers/randomToken'
import config from 'config'
import JwtHelper from '../../middlewares/JwtHelper'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'

const defaultExpiresIn: number = config.get('defaultExpiresIn')

class RefreshService extends Service {
  constructor(model: Model<any> = db.RefreshToken) {
    super(model)
    this.refresh = this.refresh.bind(this)
    this.generate = this.generate.bind(this)
  }

  public async refresh(token, ipAddress: String) {
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
      throw new ErrorResponse(500, "could not refresh token")
    }
  }

  public async generate(id: String, ipAddress: String) {
    try {
      const refreshToken: any = {
        user: id,
        token: generateRandomToken(),
        expires: new Date(Date.now() + defaultExpiresIn),
        createdByIp: ipAddress
      }
      return refreshToken
    } catch(err) {
      throw new ErrorResponse(500, "Could not generate refresh token")
    }
  }

  public async revoke(token, ipAddress) {
    token.revoked = new Date(Date.now())
    token.revokedByIp = ipAddress
    await token.save()
  }
}

export default RefreshService