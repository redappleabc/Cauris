import { ControllerProtected } from "@servichain/helpers/controllers";
import { ServiceProtected } from "@servichain/helpers/services";
import { TransactionService } from "@servichain/modules/transactions";
import { Request, Response, NextFunction } from "express";
import { IResponseHandler } from "@servichain/interfaces";
import { BaseError } from "@servichain/helpers/BaseError";
import { EHttpStatusCode } from "@servichain/enums";

export class TransactionController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service);
    this.send = this.send.bind(this);
    this.getAllByCoin = this.getAllByCoin.bind(this);
    this.getGasFees = this.getGasFees.bind(this);
  }

  public async send(req: Request, res: Response, next: NextFunction) {
    try {
      let { coinId, from, to, value } = req.body;
      const handler: IResponseHandler = await (
        this.service as TransactionService
      ).send(req.user["id"], coinId, from, to, value);
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }

  public async getGasFees(req: Request, res: Response, next: NextFunction) {
    try {
      let { coinId } = req.query
      if (!coinId)
        throw new BaseError(EHttpStatusCode.BadRequest, "Coin ID not specified for gas Estimation")
      const handler: IResponseHandler = await (this.service as TransactionService).getGasFees(coinId as string);
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

   public async getAllByCoin(req: Request, res: Response, next: NextFunction) {
    try {
      const handler: IResponseHandler = await (this.service as TransactionService).getAllByCoin(req.query)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

}
