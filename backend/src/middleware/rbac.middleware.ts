import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';

type Role = 'caregiver' | 'careseeker' | 'admin';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    next();
  };
}
