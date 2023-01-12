import config from 'config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import {readFileSync, writeFileSync, existsSync} from 'fs'
import {smh} from '@servichain/helpers/aws/SecretManagerHelper'
import { db } from './MongooseSingleton'
import { BaseError } from './BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { EError } from '@servichain/enums/EError'

export class AESHelper {
    private readonly ALGORITHM = 'aes-256-cbc'
    protected key
    protected iv: Buffer
    readonly user: string

    constructor(userId: string) {
        this.user = userId
    }

    async initialize() {
        try {
            let user = (await db.User.findOne({_id: this.user}))
            if (!user)
                return false;
            if (!user.iv) {
                let iv = Buffer.from(randomBytes(16)).toString('hex')
                user.iv = iv
                user.save()
            }
            this.iv = Buffer.from(user.iv, 'hex')
            this.key = Buffer.from((await smh.getSecret('servichain-aes-secret'))['SECRET_KEY'], 'hex')
            return true
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.AESFailed, e, true)
        }
    }

    encrypt(str: string): string {
        try {
            const cipher = createCipheriv(this.ALGORITHM, this.key, this.iv)
            let enc = cipher.update(str, 'utf8', 'base64')
            enc += cipher.final('base64')
            return enc
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.AESCipher, e, true)
        }
    }

    decrypt(enc: string) {
        try {
            const decipher = createDecipheriv(this.ALGORITHM, this.key, this.iv);
            let str = decipher.update(enc, 'base64', 'utf8');
            str += decipher.final('utf8');
            return str;
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.AESDecipher, e, true)
        }
    }
}