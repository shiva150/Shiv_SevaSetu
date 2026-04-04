import { Request, Response, NextFunction } from 'express';
import { ratingService } from '../services/rating.service.js';

export const ratingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const rating = await ratingService.createRating(req.user!.userId, req.body);
      res.status(201).json(rating);
    } catch (err) { next(err); }
  },

  async getBySession(req: Request, res: Response, next: NextFunction) {
    try {
      const rating = await ratingService.getSessionRating(req.params.sessionId);
      res.json(rating);
    } catch (err) { next(err); }
  },

  async listByCaregiver(req: Request, res: Response, next: NextFunction) {
    try {
      const ratings = await ratingService.getCaregiverRatings(req.params.caregiverId);
      res.json({ ratings });
    } catch (err) { next(err); }
  },
};
