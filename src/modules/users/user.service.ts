import bcrypt, { hash } from 'bcryptjs'
import db from '@servichain/helpers/MongooseClient'
import Service from '@servichain/helpers/services/Service'
import { Model } from 'mongoose'
import { BaseError } from '@servichain/helpers/BaseError'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import RefreshService from '../refreshs/refresh-token.service'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EUserRole } from '@servichain/enums/EUserRole'
import { EHttpStatusCode } from '@servichain/enums/EHttpError'

class UserService extends Service {
  firstUser: boolean = true
  constructor(model: Model<any> = db.User) {
    super(model)
    this.authenticate = this.authenticate.bind(this)
  }

  public async authenticate({email, password, ipAddress}) {
    const user = await this.model.findOne({email})

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new BaseError(EHttpStatusCode.NotFound, "Could not found User", true)
    }

    const {jwtToken} = JwtHelper.generate(user)
    const refreshService = new RefreshService()
    const refreshToken = await refreshService.generate(user.id, ipAddress)
    await refreshService.insert(refreshToken)
    return new ValidResponse(EHttpStatusCode.OK, { user, jwtToken, refreshToken})
  }

   public async insert(data: any)  {
    data.role = await this.checkFirstUser()
    data.password = await hash(data.password, 10)
    return super.insert(data)
  }

  private async checkFirstUser(): Promise<EUserRole> {
    if (this.firstUser) {
      this.firstUser = false
      let items = await this.model.find({})
      if (items.length == 0)
        return EUserRole.Admin
    }
    return EUserRole.User
  }
}

export default UserService