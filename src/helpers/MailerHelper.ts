import nodemailer from 'nodemailer'
import config from 'config'
import { BaseError } from './BaseError'
import { EHttpStatusCode } from '@servichain/enums'

class MailerHelper {
  transporter: nodemailer.Transporter<nodemailer.SentMessageInfo>
  constructor() {
    let smtp = config.get('smtp')
    this.transporter = nodemailer.createTransport(smtp)
  }

  async send(to: string, subject: string, mail: any) {
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
  }
}

export default new MailerHelper()