import { Router } from 'express';
import { careRequestController } from '../controllers/careRequest.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRequestSchema, updateRequestStatusSchema, listRequestsSchema } from '../validators/careRequest.schema.js';

const router = Router();

router.post('/', authenticate, requireRole('careseeker'), validate(createRequestSchema), careRequestController.create);
router.get('/', authenticate, validate(listRequestsSchema, 'query'), careRequestController.listMine);
router.get('/:id', authenticate, careRequestController.getById);
router.patch('/:id/status', authenticate, validate(updateRequestStatusSchema), careRequestController.updateStatus);
router.post('/:id/cancel', authenticate, careRequestController.cancel);

export default router;
