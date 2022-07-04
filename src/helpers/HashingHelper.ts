import config from 'config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import {readFileSync, writeFileSync, existsSync} from 'fs'


const filepath = config.util.getEnv('secretPath')

export class AESHelper {
    private readonly ALGORITHM = 'aes-256-cbc'
    private readonly encryptionKey: Buffer
    readonly iv: Buffer
    readonly user: string

    constructor(userId: string) {
        this.user = userId

        if (existsSync(filepath + this.user)) {
            let rawData = readFileSync(filepath + this.user + '.json', {encoding: 'utf8', flag: 'r'})
            let data = JSON.parse(rawData)
            this.encryptionKey = data.encryptionKey
            this.iv = data.iv
        } else {
            this.encryptionKey = randomBytes(16)
            this.iv = randomBytes(16)
            writeFileSync(filepath + this.user, JSON.stringify({
                encryptionKey: this.encryptionKey,
                iv: this.iv
            }))
        }
    }

    encrypt(str: string): string {
        const cipher = createCipheriv(this.ALGORITHM, this.encryptionKey, this.iv)
        let enc = cipher.update(str, 'utf8', 'base64')
        enc += cipher.final('base64')
        return enc
    }

    decrypt(enc: string) {
        const decipher = createDecipheriv(this.ALGORITHM, this.encryptionKey, this.iv);
        let str = decipher.update(enc, 'base64', 'utf8');
        str += decipher.final('utf8');
        return str;
    }
} 