import { ETokenType } from '@servichain/enums'
import config from 'config'

export function verificationTemplate(token: string, type: ETokenType) {
  return {
    "text":`Welcome to Servichain ! Enter the code below in the app to ${type === ETokenType.Reset ? "reset your password" : "verify your account"}. ${token}`,
    "html":`<h1>Welcome to Servichain !</h1>
    <br/>
    Enter the code below in the app to ${type === ETokenType.Reset ? "reset your password" : "verify your account"}.
    <br/>
    ${token}`
  }
}