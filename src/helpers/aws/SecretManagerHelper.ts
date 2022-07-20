import {SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager'
import {fromIni} from '@aws-sdk/credential-provider-ini'

export class SecretManagerHelper {
    private client: SecretsManagerClient
    constructor() {
        this.client = new SecretsManagerClient({region: 'us-east', credentials: fromIni({profile: 'default'})})
    }

    async getSecret(name: string): Promise<string> {
        const command = new GetSecretValueCommand({SecretId: name})
        const res = await this.client.send(command)
        console.log(res)
        return res.SecretString
    }

    async createSecret(name: string, data: string) {
        const command = new CreateSecretCommand({Name: name, SecretString: data})
        const res = await this.client.send(command)
        console.log(res)
        return res
    }
}

export const smh = new SecretManagerHelper()