import { Request, Response, NextFunction } from 'express';
import { matchingService } from '../services/matching.service.js';

export const matchController = {
  async triggerMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { request_id, limit } = req.body;
      const matches = await matchingService.matchRequest(request_id, limit);
      res.status(201).json({ matches, count: matches.length });
    } catch (err) { next(err); }
  },

  async getMatchesForRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await matchingService.getMatchesForRequest(req.params.requestId);
      res.json({ matches });
    } catch (err) { next(err); }
  },

  async getMyMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { caregiverRepository } = await import('../repositories/caregiver.repository.js');
      const caregiver = await caregiverRepository.findByUserId(req.user!.userId);
      if (!caregiver) {
        res.json({ matches: [] });
        return;
      }
      const status = req.query.status as string | undefined;
      const matches = await matchingService.getMatchesForCaregiver(caregiver.id, status);
      res.json({ matches });
    } catch (err) { next(err); }
  },

  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const match = await matchingService.respondToMatch(
        req.params.id,
        req.user!.userId,
        req.body.status
      );
      res.json(match);
    } catch (err) { next(err); }
  },
};
