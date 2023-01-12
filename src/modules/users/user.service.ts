import bcrypt from "bcryptjs";
import { db } from "@servichain/helpers/MongooseSingleton";
import { Service } from "@servichain/helpers/services";
import { Document, Model } from "mongoose";
import { BaseError } from "@servichain/helpers/BaseError";
import JwtHelper from "@servichain/middlewares/JwtHelper";
import { RefreshService } from "@servichain/modules/refreshs";
import { ValidationService } from "@servichain/modules/validations";
import { ValidResponse } from "@servichain/helpers/responses/ValidResponse";
import { EUserRole, EHttpStatusCode, ETokenType } from "@servichain/enums";
import { IUser } from "@servichain/interfaces";
import speakeasy from "speakeasy";
import { randomBytes } from "ethers/lib/utils";
import { EError } from "@servichain/enums/EError";

const UserDetailed = {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    return ret;
  },
};

export class UserService extends Service {
  firstUser: boolean = true;
  constructor(model: Model<any> = db.User) {
    super(model);
    this.authenticate = this.authenticate.bind(this);
    this.getByIdDetailed = this.getByIdDetailed.bind(this);
    this.verifyUser = this.verifyUser.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.generateSecret = this.generateSecret.bind(this);
    this.verifySecret = this.verifySecret.bind(this);
  }

  private async genHash(password: string) {
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(password, salt);
    return hash;
  }

  public async authenticate({ email, password, ipAddress }) {
    const user: IUser = await this.model.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new BaseError(
        EHttpStatusCode.NotFound, EError.ReqUsurpation);
    }
    const { jwtToken } = JwtHelper.generate(user);
    const refreshService = new RefreshService();
    const refreshToken = await refreshService.generate(
      user.id as string,
      ipAddress
    );
    await refreshService.insert(refreshToken);
    return new ValidResponse(EHttpStatusCode.OK, {
      user,
      jwtToken,
      refreshToken,
    });
  }

  public async changePassword(userId: string, password: string) {
    const user = await this.model.findById(userId);
    if (!user)
      throw new BaseError(
        EHttpStatusCode.NotFound, EError.MongoEmpty);
    user.password = await this.genHash(password);
    user.save();
    return new ValidResponse(
      EHttpStatusCode.Accepted, "Password was changed");
  }

  public async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    newPasswordRepeat: string
  ) {
    const user = await this.model.findById(userId);
    if (!user || !bcrypt.compareSync(oldPassword, user.password)) {
      throw new BaseError(EHttpStatusCode.NotFound, EError.ReqUsurpation);
    }
    if (newPassword !== newPasswordRepeat)
      throw new BaseError(
        EHttpStatusCode.BadRequest, "Password confirmation must be the same");
    user.password = await this.genHash(newPassword);
    user.save();
    return new ValidResponse(
      EHttpStatusCode.Accepted, "Password was updated");
  }

  public async generateSecret(userId: string) {
    const user = await this.model.findById(userId);

    if (!user) {
      throw new BaseError(
        EHttpStatusCode.NotFound, EError.MongoEmpty);
    }
    const secret = speakeasy.generateSecret({
      name: "S-Wallet: " + user.email,
    });
    user.secret=secret.base32
    user.secretGenerated= true
    user.save()
    return new ValidResponse(EHttpStatusCode.OK, {user});
  }

  public async verifySecret(secret:string, encoding: speakeasy.Encoding, token: string, userId:string) {
    try {
      const user = await this.model.findById(userId);
  
      if (!user) {
        throw new BaseError(EHttpStatusCode.Unauthorized, "Invalid user credentials");
      }
      if (!!user.secret && user.secret===secret) {
        const verification = speakeasy.totp.verify({
          secret,
          encoding,
          token,
        });
        if (verification) {
          user.verified2FA=true;
          user.save()
          return new ValidResponse(EHttpStatusCode.OK, {
            verification,
          });
        } else {
          return new ValidResponse(EHttpStatusCode.BadRequest, {
            verification,
          });
        }
      } else {
        return new ValidResponse(EHttpStatusCode.BadRequest, "Generate a secret first");
      }
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline, e, true)
    }
  }

  public async verifyUser(userId: string) {
    try {
      const user = await this.model.findById(userId);
      if (!user)
        throw new BaseError(EHttpStatusCode.NotFound, EError.MongoEmpty);
      user.verified = true;
      user.save();
      return new ValidResponse(EHttpStatusCode.Accepted, "User is now verified");
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline, e, true)
    }
  }

  public async insert(data: any) {
    try {
      data.role = await this.checkFirstUser();
      data.password = await this.genHash(data.password);
      let iv = Buffer.from(randomBytes(16)).toString('hex')
      data.iv = iv
      const validationService = new ValidationService();
      const result = await super.insert(data);
      await validationService.generateToken(ETokenType.Verification, data.email);
      return result;
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline, e, true)
    }
  }

  public async getByIdDetailed(query: any) {
    try {
      let responseHandler: ValidResponse = (await super.getById(query)) as ValidResponse;
      responseHandler.data.toObject(UserDetailed);
      return responseHandler;
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline, e, true)
    }
  }

  public async getByUsername(query: any) {
    try {
      const { username } = query;
      if (!username) {
        throw new BaseError(EHttpStatusCode.BadRequest, EError.ReqIncompleteQuery);
      }
      const result = await db.User.findOne({ username });
      if (!result)
        throw new BaseError(EHttpStatusCode.BadRequest, EError.MongoEmpty);
      return new ValidResponse(EHttpStatusCode.OK, result.id);
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.Offline, e, true)
    }
  }

  //internal
  private async checkFirstUser(): Promise<EUserRole> {
    if (this.firstUser) {
      this.firstUser = false;
      let items = await this.model.find({});
      if (items.length == 0) return EUserRole.Admin;
    }
    return EUserRole.User;
  }
}
