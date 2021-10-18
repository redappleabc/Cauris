import { EUserRole } from "@servichain/enums/EUserRole";
import { errorMiddleware } from '@servichain/middlewares/ErrorHandler'
import { Request, Response, NextFunction } from 'express'
import { BaseError } from '@servichain/helpers/BaseError'
import { sign, verify } from 'jsonwebtoken'
import jwt from 'express-jwt';
import db from "@servichain/helpers/MongooseClient";
import config from 'config'
import { EHttpStatusCode } from "@servichain/enums/EHttpError";

const secret: string = config.get('secret')
const defaultExpiresIn: number = config.get('defaultExpiresIn')

class JwtHelper {
  public generate(user: any) {
    const token = sign(user.toJSON() , secret, {algorithm: 'HS256', expiresIn: defaultExpiresIn})
    return { jwtToken: token, defaultExpiresIn }
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