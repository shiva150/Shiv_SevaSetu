import { Router } from 'express';
import { sosController } from '../controllers/sos.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSosSchema, updateSosSchema } from '../validators/sos.schema.js';

const router = Router();

router.post('/', authenticate, validate(createSosSchema), sosController.trigger);
router.get('/active', authenticate, requireRole('admin'), sosController.listActive);
router.get('/', authenticate, requireRole('admin'), sosController.listAll);
router.patch('/:id/acknowledge', authenticate, requireRole('admin'), validate(updateSosSchema), sosController.acknowledge);
router.patch('/:id/resolve', authenticate, requireRole('admin'), validate(updateSosSchema), sosController.resolve);

export default router;
