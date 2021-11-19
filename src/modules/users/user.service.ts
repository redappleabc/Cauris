import bcrypt, { hash } from 'bcryptjs'
import db from '@servichain/helpers/MongooseClient'
import { Service } from '@servichain/helpers/services'
import { Model } from 'mongoose'
import { BaseError } from '@servichain/helpers/BaseError'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {RefreshService} from '@servichain/modules/refreshs'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EUserRole, EHttpStatusCode } from '@servichain/enums'

export class UserService extends Service {
  firstUser: boolean = true
  constructor(model: Model<any> = db.User) {
    super(model)
    this.authenticate = this.authenticate.bind(this)
  }

  public async authenticate({email, password, ipAddress}) {
    try {
      const user = await this.model.findOne({email})
      if (!user || !bcrypt.compareSync(password, user.password)) {
        throw new BaseError(EHttpStatusCode.NotFound, "Could not found User", true)
      }

      const {jwtToken} = JwtHelper.generate(user)
      const refreshService = new RefreshService()
      const refreshToken = await refreshService.generate(user.id, ipAddress)
      await refreshService.insert(refreshToken)
      return new ValidResponse(EHttpStatusCode.OK, { user, jwtToken, refreshToken})
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
    }
  }

  public async changePassword(userId: string, password: string) {
    try {
      const user = await this.model.findById(userId)
      if (!user)
        throw new BaseError(EHttpStatusCode.NotFound, "Could not found User", true)
      user.password = await hash(password, 10)
      user.save()
      return new ValidResponse(EHttpStatusCode.Accepted, "Password was changed")
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
    }
  }

  public async verifyUser(userId: string) {
    try {
      const user = await this.model.findById(userId)
      if (!user)
        throw new BaseError(EHttpStatusCode.NotFound, "Could not found User", true)
      user.verified = true
      user.save()
      return new ValidResponse(EHttpStatusCode.Accepted, "User is now verified")
    } catch (err) {
      if (err instanceof BaseError)
        throw err
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
    }
  }

  public async insert(data: any)  {
    data.role = await this.checkFirstUser()
    data.password = await hash(data.password, 10)
    return super.insert(data)
  }

  //internal
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