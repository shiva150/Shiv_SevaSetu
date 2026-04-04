import { Request, Response, NextFunction } from 'express';
import { caregiverService } from '../services/caregiver.service.js';

export const caregiverController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await caregiverService.createProfile(req.user!.userId, req.body);
      res.status(201).json(profile);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await caregiverService.updateProfile(req.user!.userId, req.body);
      res.json(profile);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await caregiverService.getProfile(req.params.id);
      res.json(profile);
    } catch (err) { next(err); }
  },

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await caregiverService.getProfileByUserId(req.user!.userId);
      res.json(profile);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await caregiverService.list(req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await caregiverService.verify(req.params.id);
      res.json(profile);
    } catch (err) { next(err); }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      await caregiverService.reject(req.params.id);
      res.json({ message: 'Caregiver rejected' });
    } catch (err) { next(err); }
  },

  async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const { caregiverRepository } = await import('../repositories/caregiver.repository.js');
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await caregiverRepository.listPendingVerification(page, limit);
      res.json({ data });
    } catch (err) { next(err); }
  },
};
