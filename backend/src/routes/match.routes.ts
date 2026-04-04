import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { triggerMatchSchema, respondMatchSchema } from '../validators/match.schema.js';

const router = Router();

// Trigger matching (careseeker or admin)
router.post('/', authenticate, requireRole('careseeker', 'admin'), validate(triggerMatchSchema), matchController.triggerMatch);

// Get matches for a specific request
router.get('/request/:requestId', authenticate, matchController.getMatchesForRequest);

// Caregiver: see my incoming match offers
router.get('/mine', authenticate, requireRole('caregiver'), matchController.getMyMatches);

// Caregiver: accept/reject a match
router.patch('/:id', authenticate, requireRole('caregiver'), validate(respondMatchSchema), matchController.respond);

export default router;
