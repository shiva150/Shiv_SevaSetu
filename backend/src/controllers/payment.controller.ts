import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';

export const paymentController = {
  async getBySession(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.getBySession(req.params.sessionId);
      res.json(payment);
    } catch (err) { next(err); }
  },

  async release(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.releaseFunds(req.params.sessionId, req.user!.userId);
      res.json(payment);
    } catch (err) { next(err); }
  },

  async dispute(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.disputePayment(req.params.sessionId, req.user!.userId);
      res.json(payment);
    } catch (err) { next(err); }
  },

  async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { resolution } = req.body;
      const payment = await paymentService.resolveDispute(req.params.id, resolution);
      res.json(payment);
    } catch (err) { next(err); }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await paymentService.listUserPayments(req.user!.userId, page, limit);
      res.json(result);
    } catch (err) { next(err); }
  },
};
