import config from 'config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import {readFileSync, writeFileSync, existsSync} from 'fs'
import {smh} from '@servichain/helpers/aws/SecretManagerHelper'
import { db } from './MongooseSingleton'

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
            if (!user.iv) {
                let iv = Buffer.from(randomBytes(16)).toString('hex')
                console.log("iv : " + iv)
                user.iv = iv
                user.save()
            }
            this.iv = Buffer.from(user.iv, 'hex')
            this.key = Buffer.from((await smh.getSecret('servichain-aes-secret'))['SECRET_KEY'], 'hex')
            console.log(this.iv)
            console.log(this.key)
        } catch (err) {throw err}
    }

    encrypt(str: string): string {
        const cipher = createCipheriv(this.ALGORITHM, this.key, this.iv)
        let enc = cipher.update(str, 'utf8', 'base64')
        enc += cipher.final('base64')
        console.log("encryption : " + enc)
        return enc
    }

    decrypt(enc: string) {
        console.log("encrypted value : " + enc)
        const decipher = createDecipheriv(this.ALGORITHM, this.key, this.iv);
        let str = decipher.update(enc, 'base64', 'utf8');
        str += decipher.final('utf8');
        console.log("decrypted value : " + str)
        return str;
    }
} 