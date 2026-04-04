import { Router } from 'express';
import { caregiverController } from '../controllers/caregiver.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCaregiverSchema, updateCaregiverSchema, listCaregiversSchema } from '../validators/caregiver.schema.js';

const router = Router();

// Public
router.get('/', optionalAuth, validate(listCaregiversSchema, 'query'), caregiverController.list);
router.get('/:id', caregiverController.getById);

// Caregiver-only
router.post('/', authenticate, requireRole('caregiver'), validate(createCaregiverSchema), caregiverController.create);
router.put('/', authenticate, requireRole('caregiver'), validate(updateCaregiverSchema), caregiverController.update);
router.get('/me/profile', authenticate, requireRole('caregiver'), caregiverController.getMyProfile);

// Admin
router.get('/admin/pending', authenticate, requireRole('admin'), caregiverController.listPending);
router.post('/:id/verify', authenticate, requireRole('admin'), caregiverController.verify);
router.post('/:id/reject', authenticate, requireRole('admin'), caregiverController.reject);

export default router;
