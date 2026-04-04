import { Router } from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { startSessionSchema, endSessionSchema, listSessionsSchema } from '../validators/session.schema.js';

const router = Router();

router.post('/start', authenticate, validate(startSessionSchema), sessionController.start);
router.post('/:id/complete', authenticate, validate(endSessionSchema), sessionController.complete);
router.post('/:id/cancel', authenticate, sessionController.cancel);
router.get('/', authenticate, validate(listSessionsSchema, 'query'), sessionController.listMine);
router.get('/:id', authenticate, sessionController.getById);

export default router;
