import {SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager'
import {fromIni} from '@aws-sdk/credential-provider-ini'
import { EHttpStatusCode } from '@servichain/enums'
import { BaseError } from '../BaseError'

export class SecretManagerHelper {
    private client: SecretsManagerClient
    constructor() {
        this.client = new SecretsManagerClient({region: 'us-east-2'})//, credentials: fromIni({profile: 'servichain'})
    }

    async getSecret(name: string): Promise<string> {
        const command = new GetSecretValueCommand({SecretId: name})
        const res = await this.client.send(command)
        if ('SecretString' in res)
            return JSON.parse(res.SecretString)
        else
            throw new BaseError(EHttpStatusCode.InternalServerError, "AWS Secret was not retrieved")
    }

    async createSecret(name: string, data: string) {
        const command = new CreateSecretCommand({Name: name, SecretString: data})
        const res = await this.client.send(command)
        console.log(res)
        return res
    }
}

export const smh = new SecretManagerHelper()