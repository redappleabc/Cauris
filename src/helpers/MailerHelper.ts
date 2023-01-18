import nodemailer from 'nodemailer'
import config from 'config'
import { BaseError } from './BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { EError } from '@servichain/enums/EError'

class MailerHelper {
  transporter: nodemailer.Transporter<nodemailer.SentMessageInfo>
  constructor() {
    try {
      let smtp = config.get('smtp')
      this.transporter = nodemailer.createTransport(smtp)
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MailerOffline, e, true)
    }
  }

  async send(to: string, subject: string, mail: any) {
    try {
      const {text, html} = mail
      let status = await this.transporter.verify()
      if (!status)
        throw new BaseError(EHttpStatusCode.InternalServerError, "Mail Service offline")
      this.transporter.sendMail({
        from: '"Servichain" no-reply@servichain.io',
        to,
        subject,
        text,
        html
      })
    } catch (e) {
      throw new BaseError(EHttpStatusCode.InternalServerError, EError.MailerOffline, e, true)
    }
  }
}

export default new MailerHelper()