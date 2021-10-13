import { EUserRole } from "../enums/EUserRole";
import { Request, Response, NextFunction } from 'express'
import { sign, verify } from 'jsonwebtoken'
import jwt from 'express-jwt';
import db from "../helpers/MongooseClient";
import { ErrorResponse } from "../helpers/RequestHelpers/ErrorResponse";
import config from 'config'
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
                        throw new ErrorResponse(401, "Unauthorized")
                    }
                    next()
                } catch (err) {
                    next(err)
                }
            },
            async (err: Error, req: Request, res: Response, next: NextFunction) => {
                if (err) {
                    throw new ErrorResponse(err['status'], err['message'])
                }
                next()
            }
        ]
    }

    private async middlewareError() {
        return (err: Error, req: Request, res: Response, next: NextFunction) => {
            if (err) {
                throw new ErrorResponse(err['status'], err['message'])
            }
            console.log("middleware error")
            next()
        }
    }

    public async checkRoles(roles: Array<EUserRole>) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = res['locals'].user
            if (roles.length && !roles.includes(user['role'])) {
                throw new ErrorResponse(401, "Unauthorized")
            }
            console.log("checkRoles")
            next()
        }
    }
}

export default new JwtHelper()