import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service.js';

export const sessionController = {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await sessionService.startSession(
        req.body.match_id,
        req.user!.userId,
        req.body.notes
      );
      res.status(201).json(session);
    } catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await sessionService.completeSession(
        req.params.id,
        req.user!.userId,
        req.body.notes
      );
      res.json(session);
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await sessionService.cancelSession(req.params.id, req.user!.userId);
      res.json(session);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await sessionService.getById(req.params.id);
      res.json(session);
    } catch (err) { next(err); }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.user!.role as 'caregiver' | 'careseeker';
      const result = await sessionService.listByUser(req.user!.userId, role, req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },
};
