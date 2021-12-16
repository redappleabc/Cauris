import Joi from '@hapi/joi';
import { Request, Response, NextFunction} from 'express'
import { JoiValidator } from '@servichain/middlewares/JoiValidator';
import * as bip39 from 'bip39'

function checkMnemonicWords(mnemonicArray: Array<string>, lang: string) {
  for(let i = 0; i < mnemonicArray.length; i++) {
    let hasWord: boolean = bip39.wordlists[lang].includes(mnemonicArray[i])
    if (!hasWord)
      return false
  }
  return true
}

export function generateSchema(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    name: Joi.string().empty('').max(50),
    mnemonic: Joi.string().empty('').custom((value: string, helper) => {
      let lang: string = (req.query.lang) ? req.query['lang'].toString() : "english"
      let mnemonicArray: Array<string> = value.trim().split(/\s+/g)
      if (mnemonicArray.length < 12 || mnemonicArray.length > 24) {
        return helper.error("Mnemonic must have between 12 and 24 words")
      } else if (!checkMnemonicWords(mnemonicArray, lang)) {
        return helper.error('Mnemonic words werent found in the wordlist, please check the language selected')
      } else
        return value
    })
  })
  const validator = new JoiValidator(schema)
  validator.middleware(req, next)
}