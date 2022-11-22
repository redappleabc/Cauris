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
    this.estimate = this.estimate.bind(this);
    this.estimateSwap = this.estimateSwap.bind(this)
    this.approveSwap = this.approveSwap.bind(this)
    this.sendSwap = this.sendSwap.bind(this)
    this.getBtcUnspentTransactions = this.getBtcUnspentTransactions.bind(this)
  }

  public async send(req: Request, res: Response, next: NextFunction) {
    try {
      let { coinId, from, to, value, unSpentTransactions } = req.body;
      const handler: IResponseHandler = await (
        this.service as TransactionService
      ).send(req.user["id"], coinId, from, to, value, unSpentTransactions);
      handler.handleResponse(res);
    } catch (err) {
      next(err);
    }
  }

  public async estimateSwap(req: Request, res: Response, next: NextFunction) {
    try {
      let {srcCoinId, destCoinId, from, value} = req.body
      const handler: IResponseHandler = await(this.service as TransactionService).estimateSwap(
        req.user['id'], srcCoinId, destCoinId, from, value
      );
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async approveSwap(req: Request, res: Response, next:NextFunction) {
    try {
      let {coinId, from, priceRoute} = req.body
      const handler: IResponseHandler = await(this.service as TransactionService).approveSwap(
        req.user['id'], coinId, from, priceRoute
      )
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async sendSwap(req: Request, res: Response, next: NextFunction) {
    try {
      let {coinId, from, txSwap} = req.body
      const handler: IResponseHandler = await(this.service as TransactionService).sendSwap(
        req.user['id'], coinId, from, txSwap
      );
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async estimate(req: Request, res: Response, next: NextFunction) {
    try {
      let { coinId, from, to, value } = req.body
      if (!coinId)
        throw new BaseError(EHttpStatusCode.BadRequest, "Coin ID not specified for gas Estimation")
      const handler: IResponseHandler = await (this.service as TransactionService
        ).estimateTransfer(req.user["id"], coinId, from, to, value);
      handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

   public async getAllByCoin(req: Request, res: Response, next: NextFunction) {
    try {
      const handler: IResponseHandler = await (this.service as TransactionService).getAllByCoin(req.user["id"], req.query)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

  public async getBtcUnspentTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const handler: IResponseHandler = await (this.service as TransactionService).getBtcUnspentTransactions(req.user["id"], req.query)
      return handler.handleResponse(res)
    } catch (err) {
      next(err)
    }
  }

}
