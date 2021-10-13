import bcrypt, { hash } from 'bcryptjs'
import db from '../../helpers/MongooseClient'
import Service from '../../helpers/Service'
import { Model } from 'mongoose'
import { ErrorResponse } from '../../helpers/RequestHelpers/ErrorResponse'
import JwtHelper from '../../middlewares/JwtHelper'
import RefreshService from '../refreshs/refresh-token.service'
import { ValidResponse } from '../../helpers/RequestHelpers/ValidResponse'
import { EUserRole } from '../../enums/EUserRole'

class UserService extends Service {
  firstUser: boolean = true
  constructor(model: Model<any> = db.User) {
    super(model)
    this.authenticate = this.authenticate.bind(this)
  }

  public async authenticate({email, password, ipAddress}) {
    const user = await this.model.findOne({email})

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new ErrorResponse(400, "Could not found User")
    }

    const {jwtToken} = JwtHelper.generate(user)
    const refreshService = new RefreshService()
    const refreshToken = await refreshService.generate(user.id, ipAddress)
    await refreshService.insert(refreshToken)
    return new ValidResponse(200, { user, jwtToken, refreshToken})
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