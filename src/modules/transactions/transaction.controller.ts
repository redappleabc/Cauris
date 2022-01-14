import { ControllerProtected } from "@servichain/helpers/controllers";
import { ServiceProtected } from "@servichain/helpers/services";
import { TransactionService } from "@servichain/modules/transactions";
import { Request, Response, NextFunction } from "express";
import { IResponseHandler } from "@servichain/interfaces";

export class TransactionController extends ControllerProtected {
  constructor(service: ServiceProtected) {
    super(service);
    this.send = this.send.bind(this);
    this.getAllByCoin = this.getAllByCoin.bind(this);
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

   public async getAllByCoin(req: Request, res: Response, next: NextFunction) {
    try {
      let handler: IResponseHandler = await (this.service as TransactionService).getAllByCoin(req.query)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

}
