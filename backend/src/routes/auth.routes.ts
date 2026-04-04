import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { signupSchema, loginSchema, refreshSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateProfile);
router.get('/onboarding', authenticate, authController.getOnboarding);
router.patch('/onboarding', authenticate, authController.updateOnboarding);

export default router;
