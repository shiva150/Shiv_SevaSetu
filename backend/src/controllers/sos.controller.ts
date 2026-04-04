import { Request, Response, NextFunction } from 'express';
import { sosService } from '../services/sos.service.js';

export const sosController = {
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await sosService.trigger(req.user!.userId, req.body);
      res.status(201).json(alert);
    } catch (err) { next(err); }
  },

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await sosService.acknowledge(req.params.id);
      res.json(alert);
    } catch (err) { next(err); }
  },

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await sosService.resolve(req.params.id);
      res.json(alert);
    } catch (err) { next(err); }
  },

  async listActive(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await sosService.listActive();
      res.json({ alerts });
    } catch (err) { next(err); }
  },

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await sosService.listAll(page, limit);
      res.json(result);
    } catch (err) { next(err); }
  },
};
