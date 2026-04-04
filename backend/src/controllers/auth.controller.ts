import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      res.json(tokens);
    } catch (err) { next(err); }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({ message: 'Logged out' });
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findByIdPublic(req.user!.userId);
      res.json(user);
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userRepository.update(req.user!.userId, req.body);
      res.json(updated);
    } catch (err) { next(err); }
  },

  async getOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const onboarding = await userRepository.getOnboarding(req.user!.userId);
      res.json(onboarding ?? { step: null, completed: false });
    } catch (err) { next(err); }
  },

  async updateOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const { step, completed } = req.body as { step: string; completed?: boolean };
      const validSteps = ['personal_info', 'skills', 'verification', 'submitted'];
      if (!validSteps.includes(step)) {
        res.status(400).json({ error: 'Invalid onboarding step', code: 'VALIDATION_ERROR' });
        return;
      }
      await userRepository.updateOnboarding(
        req.user!.userId,
        step as 'personal_info' | 'skills' | 'verification' | 'submitted',
        completed ?? (step === 'submitted')
      );
      res.json({ step, completed: completed ?? (step === 'submitted') });
    } catch (err) { next(err); }
  },
};
