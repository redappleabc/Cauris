import bcrypt from 'bcryptjs'
import {db} from '@servichain/helpers/MongooseSingleton'
import { Service } from '@servichain/helpers/services'
import { Document, Model } from 'mongoose'
import { BaseError } from '@servichain/helpers/BaseError'
import JwtHelper from '@servichain/middlewares/JwtHelper'
import {RefreshService} from '@servichain/modules/refreshs'
import {ValidationService} from '@servichain/modules/validations'
import { ValidResponse } from '@servichain/helpers/responses/ValidResponse'
import { EUserRole, EHttpStatusCode, ETokenType } from '@servichain/enums'
import { IUser } from '@servichain/interfaces'

const UserDetailed = {
  virtuals: true,
  versionKey: false,
  transform : function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.password
    return ret
  }
}

export class UserService extends Service {
  firstUser: boolean = true
  constructor(model: Model<any> = db.User) {
    super(model)
    this.authenticate = this.authenticate.bind(this)
    this.getByIdDetailed = this.getByIdDetailed.bind(this)
    this.verifyUser = this.verifyUser.bind(this)
    this.changePassword = this.changePassword.bind(this)
  }

  private async genHash(password: string) {
    try {
      let salt = await bcrypt.genSalt(10)
      let hash = await bcrypt.hash(password, salt)
      return hash
    } catch(err) {
      throw new BaseError(EHttpStatusCode.InternalServerError, "An unknown error as occured")
    }
  }

  public async authenticate({email, password, ipAddress}) {
    try {
      const user: IUser = await this.model.findOne({email})
      if (!user || !bcrypt.compareSync(password, user.password)) {
        throw new BaseError(EHttpStatusCode.NotFound, "Could not found User", true)
      }
      const {jwtToken} = JwtHelper.generate(user)
      const refreshService = new RefreshService()
      const refreshToken = await refreshService.generate((user.id as string), ipAddress)
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
      user.password = await this.genHash(password)
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
    data.password = await this.genHash(data.password)
    const validationService = new ValidationService()
    const result = await super.insert(data)
    await validationService.generateToken(ETokenType.Verification, data.email)
    return result
  }

  public async getByIdDetailed(query: any) {
    let responseHandler: ValidResponse = await super.getById(query) as ValidResponse
    responseHandler.data.toObject(UserDetailed)
    return responseHandler
  }

  public async getByUsername(query: any) {
    const {username} = query
    if (!username) {
      throw new BaseError(EHttpStatusCode.BadRequest, "Please specify an username")
    }
    const result = await db.User.findOne({username})
    if (!result)
      throw new BaseError(EHttpStatusCode.BadRequest, "The username does not belong to any user")
    return new ValidResponse(EHttpStatusCode.OK, result.id)
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
