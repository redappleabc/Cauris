import config from "config";
import { Controller } from "@servichain/helpers/controllers";
import { UserService } from "@servichain/modules/users";
import { Request, Response, NextFunction } from "express";
import { ValidResponse } from "@servichain/helpers/responses/ValidResponse";

const refreshTokenExpiresIn: number = config.get("tokens.refreshExpiresIn");

export class UserController extends Controller {
  constructor(service: UserService) {
    super(service);
    this.authenticate = this.authenticate.bind(this);
    this.getByIdDetailed = this.getByIdDetailed.bind(this);
    this.verifyUser = this.verifyUser.bind(this);
    this.passwordForgotten = this.passwordForgotten.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.generateSecret = this.generateSecret.bind(this);
    this.verifySecret = this.verifySecret.bind(this);
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress: string = req.ip;
      const handler: ValidResponse = await (
        this.service as UserService
      ).authenticate({ email, password, ipAddress });
      const refreshToken = handler.getBody();
      this.setTokenCookie(res, refreshToken);
      delete handler.message.refreshToken;
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }

  public async passwordForgotten(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { newPassword } = req.body;
      const handler: ValidResponse = await (
        this.service as UserService
      ).changePassword(req.params.id, newPassword);
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }
  public async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword, newPasswordRepeat } = req.body;
      const handler: ValidResponse = await (
        this.service as UserService
      ).updatePassword(
        req.user["id"],
        oldPassword,
        newPassword,
        newPasswordRepeat
      );
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }

  /* 2FA verification : generate secret */
  public async generateSecret(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const handler: ValidResponse = await (
        this.service as UserService
      ).generateSecret(userId);
      handler.handleResponse(res);
    } catch (error) {
      next(error);
    }
  }

  /* 2FA verification */
  public async verifySecret(req: Request, res: Response, next: NextFunction) {
    try {
      const { secret, encoding, token } = req.body;
      const userId = res.locals.user.id;
      const handler: ValidResponse = await (this.service as UserService).verifySecret(
        secret,
        encoding,
        token,
        userId
      );
      handler.handleResponse(res);
    } catch (error) {
      next(error);
    }
  }

  public async verifyUser(req: Request, res: Response, next: NextFunction) {
    try {
      const handler: ValidResponse = await (
        this.service as UserService
      ).verifyUser(req.params.id);
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }

  public async getByIdDetailed(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const handler: ValidResponse = await (
        this.service as UserService
      ).getByIdDetailed(req.query);
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }

  //internal
  protected setTokenCookie(res: Response, token: any) {
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + refreshTokenExpiresIn),
    };

    res.cookie("refreshToken", token, cookieOptions);
  }
}
