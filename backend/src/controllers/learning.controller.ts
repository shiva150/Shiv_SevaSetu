import { Request, Response, NextFunction } from 'express';
import { learningService } from '../services/learning.service.js';

export const learningController = {
  // -- Modules --
  async createModule(req: Request, res: Response, next: NextFunction) {
    try {
      const module = await learningService.createModule(req.body);
      res.status(201).json(module);
    } catch (err) { next(err); }
  },

  async updateModule(req: Request, res: Response, next: NextFunction) {
    try {
      const module = await learningService.updateModule(req.params.id, req.body);
      res.json(module);
    } catch (err) { next(err); }
  },

  async deleteModule(req: Request, res: Response, next: NextFunction) {
    try {
      await learningService.deleteModule(req.params.id);
      res.json({ message: 'Module deleted' });
    } catch (err) { next(err); }
  },

  async listModules(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.all === 'true';
      const modules = await learningService.listModules(includeInactive);
      res.json({ modules });
    } catch (err) { next(err); }
  },

  async getModule(req: Request, res: Response, next: NextFunction) {
    try {
      const module = await learningService.getModule(req.params.id);
      res.json(module);
    } catch (err) { next(err); }
  },

  // -- Progress --
  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await learningService.updateProgress(req.user!.userId, req.body);
      res.json(progress);
    } catch (err) { next(err); }
  },

  async getMyProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await learningService.getUserProgress(req.user!.userId);
      res.json({ progress });
    } catch (err) { next(err); }
  },
};
