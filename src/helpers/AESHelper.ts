import config from 'config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import {readFileSync, writeFileSync, existsSync} from 'fs'
import {smh} from '@servichain/helpers/aws/SecretManagerHelper'

const SECRET_FILEPATH = config.util.getEnv('secretPath')

export class AESHelper {
    private readonly ALGORITHM = 'aes-256-cbc'
    private readonly key: Buffer
    readonly iv: Buffer
    readonly user: string

    constructor(userId: string) {
        this.user = userId
        let filepath = SECRET_FILEPATH + this.user + '.json'

        if (existsSync(filepath)) {
            let rawData = readFileSync(filepath, {encoding: 'utf8', flag: 'r'})
            let data = JSON.parse(rawData)
            this.key = Buffer.from(data.key)
            this.iv = Buffer.from(data.iv)
        } else {
            this.key = randomBytes(32)
            this.iv = randomBytes(16)
            writeFileSync(filepath, JSON.stringify({
                key: this.key,
                iv: this.iv
            }))
        }
    }

    encrypt(str: string): string {
        console.log(this.key)
        console.log(this.iv)
        const cipher = createCipheriv(this.ALGORITHM, this.key, this.iv)
        let enc = cipher.update(str, 'utf8', 'base64')
        enc += cipher.final('base64')
        return enc
    }

    decrypt(enc: string) {
        const decipher = createDecipheriv(this.ALGORITHM, this.key, this.iv);
        let str = decipher.update(enc, 'base64', 'utf8');
        str += decipher.final('utf8');
        return str;
    }
} 