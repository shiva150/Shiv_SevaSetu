import { Router } from 'express';
import { ratingController } from '../controllers/rating.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRatingSchema } from '../validators/rating.schema.js';

const router = Router();

router.post('/', authenticate, requireRole('careseeker'), validate(createRatingSchema), ratingController.create);
router.get('/session/:sessionId', authenticate, ratingController.getBySession);
router.get('/caregiver/:caregiverId', ratingController.listByCaregiver);

export default router;
