import { Request, Response, NextFunction } from 'express';
import { careRequestService } from '../services/careRequest.service.js';

export const careRequestController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await careRequestService.create(req.user!.userId, req.body);
      res.status(201).json(request);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await careRequestService.getById(req.params.id);
      res.json(request);
    } catch (err) { next(err); }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await careRequestService.listByUser(req.user!.userId, req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await careRequestService.updateStatus(req.params.id, req.body.status, req.user!.userId);
      res.json(updated);
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const cancelled = await careRequestService.cancel(req.params.id, req.user!.userId);
      res.json(cancelled);
    } catch (err) { next(err); }
  },
};
