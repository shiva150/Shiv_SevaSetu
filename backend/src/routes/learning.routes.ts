import { Router } from 'express';
import { learningController } from '../controllers/learning.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createModuleSchema, updateModuleSchema, updateProgressSchema } from '../validators/learning.schema.js';

const router = Router();

// Public
router.get('/modules', learningController.listModules);
router.get('/modules/:id', learningController.getModule);

// Admin
router.post('/modules', authenticate, requireRole('admin'), validate(createModuleSchema), learningController.createModule);
router.put('/modules/:id', authenticate, requireRole('admin'), validate(updateModuleSchema), learningController.updateModule);
router.delete('/modules/:id', authenticate, requireRole('admin'), learningController.deleteModule);

// User progress
router.post('/progress', authenticate, validate(updateProgressSchema), learningController.updateProgress);
router.get('/progress', authenticate, learningController.getMyProgress);

export default router;
