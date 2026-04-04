import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/mine', authenticate, paymentController.listMine);
router.get('/session/:sessionId', authenticate, paymentController.getBySession);
router.post('/session/:sessionId/release', authenticate, requireRole('careseeker'), paymentController.release);
router.post('/session/:sessionId/dispute', authenticate, paymentController.dispute);

// Admin: resolve dispute
router.post('/:id/resolve', authenticate, requireRole('admin'), paymentController.resolveDispute);

export default router;
