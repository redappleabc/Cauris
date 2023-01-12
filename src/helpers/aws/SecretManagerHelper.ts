import {SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager'
import {fromIni} from '@aws-sdk/credential-provider-ini'
import { EHttpStatusCode } from '@servichain/enums'
import { EError } from '@servichain/enums/EError'
import { Base } from 'crypto-ts/src/lib/Base'
import { BaseError } from '../BaseError'

export class SecretManagerHelper {
    private client: SecretsManagerClient
    constructor() {
        try {
            this.client = new SecretsManagerClient({region: 'us-east-2'})//, credentials: fromIni({profile: 'servichain'})})
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.AWSBadCredentials, e, true)
        }
    }

    async getSecret(name: string): Promise<string> {
        try {
            const command = new GetSecretValueCommand({SecretId: name})
            const res = await this.client.send(command)
            if ('SecretString' in res)
                return JSON.parse(res.SecretString)
            else
                throw new BaseError(EHttpStatusCode.InternalServerError, EError.AWSSecretFailed)
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.AWSOffline, e, true)
        }
    }

    async createSecret(name: string, data: string) {
        try {
            const command = new CreateSecretCommand({Name: name, SecretString: data})
            const res = await this.client.send(command)
            return res
        } catch (e) {
            throw new BaseError(EHttpStatusCode.InternalServerError, EError.AWSOffline, e, true)
        }
    }
}

export const smh = new SecretManagerHelper()