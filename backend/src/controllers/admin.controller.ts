import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';

export const adminController = {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await adminService.getAnalytics();
      res.json(analytics);
    } catch (err) { next(err); }
  },
};
