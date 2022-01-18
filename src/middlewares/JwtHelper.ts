import { EUserRole } from "@servichain/enums/EUserRole";
import { errorMiddleware } from '@servichain/middlewares/ErrorHandler'
import { Request, Response, NextFunction } from 'express'
import { BaseError } from '@servichain/helpers/BaseError'
import { sign, verify } from 'jsonwebtoken'
import jwt from 'express-jwt';
import db from "@servichain/helpers/MongooseClient";
import config from 'config'
import { EHttpStatusCode } from "@servichain/enums";

const secret: string = config.get('secrets.app')
const refreshTokenExpiresIn: number = config.get('tokens.refreshExpiresIn')

class JwtHelper {
  public generate(user: any) {
    const token = sign(user.toJSON() , secret, {algorithm: 'HS256', expiresIn: refreshTokenExpiresIn})
    return { jwtToken: token, refreshTokenExpiresIn }
  }

  public decode(token: string) {
    return verify(token, secret, { algorithms: 'HS256'})
  }

  public middleware(roles: Array<EUserRole> = []) {
    return [
      jwt({secret: secret, algorithms: ['HS256']}),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const user = await db.User.findById(req.user['id'])
          if (!user.verified)
            throw new BaseError(EHttpStatusCode.Unauthorized, "Please verify your email to access the app", true)
          const refreshToken = await db.RefreshToken.find({user: req.user['id']})
          user['ownsToken'] = token => !!refreshToken.find(x => x.token === token)
          res['locals'].user = user
          if (roles.length && !roles.includes(user['role'])) {
            throw new BaseError(EHttpStatusCode.Unauthorized, "Unauthorized", true)
          }
          next()
        } catch (err) {
          next(err)
        }
      },
      errorMiddleware
    ]
  }
}

export default new JwtHelper()