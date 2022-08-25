import { ServiceProtected } from '@servichain/helpers/services'
import { PaymentsService } from '@servichain/modules/payments'
import { Request, Response, NextFunction } from 'express'
import { IResponseHandler } from '@servichain/interfaces'
import { ControllerProtected } from '@servichain/helpers/controllers'
import { createHmac, timingSafeEqual } from 'crypto'
import config from 'config'
import { BaseError } from '@servichain/helpers/BaseError'
import { EHttpStatusCode } from '@servichain/enums'
import { ICinetNotify } from '@servichain/interfaces/IPay'
import { ValidResponse } from '@servichain/helpers/responses'

export class PaymentsController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service)
    this.notifyCinet = this.notifyCinet.bind(this)
    this.pingCinet = this.pingCinet.bind(this)
  }

  public async notifyCinet(req: Request, res: Response, next: NextFunction) {
    try {
      let data: ICinetNotify = req.body
      this.verifyCinetToken(data, req.headers['x-token'] as string)
      //call cinet to verify tx state
      /*const handler: IResponseHandler = await (
        this.service as PaymentsService
      ).updatePayment();
      handler.handleResponse(res);*/
    } catch (err) {
      next(err);
    }
  }

  public async pingCinet(req: Request, res: Response, next: NextFunction) {
    try {
      const handler: IResponseHandler = new ValidResponse(EHttpStatusCode.OK, {'status': 'OK'})
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  private async verifyCinetToken({
    cpm_site_id, 
    cpm_trans_id, 
    cpm_trans_date, 
    cpm_amount, cpm_currency, 
    signature,
    payment_method, 
    cel_phone_num, 
    cpm_phone_prefixe, 
    cpm_language, 
    cpm_version,
    cpm_payment_config, 
    cpm_page_action, 
    cpm_custom, 
    cpm_designation}
    : ICinetNotify, xToken: string) {
      let data: string = cpm_site_id + cpm_trans_id + cpm_trans_date + cpm_amount + cpm_currency + signature + 
      payment_method + cel_phone_num + cpm_phone_prefixe + cpm_language + cpm_version 
      + cpm_payment_config + cpm_page_action + cpm_custom + cpm_designation
      let secret: string = config.has('cinetSecret') ? config.get('cinetSecret') : null
      if (!secret)
        throw new BaseError(EHttpStatusCode.InternalServerError, "Secret not Set")
      let hmac = createHmac('sha256', secret)
      hmac.update(data)
      let hash = hmac.digest()
      if (!timingSafeEqual(hash, Buffer.from(xToken)))
        throw new BaseError(EHttpStatusCode.Unauthorized, 'Cinet x-token header is invalid')
  }
}