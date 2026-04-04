import { Router } from 'express';
import authRoutes from './auth.routes.js';
import caregiverRoutes from './caregiver.routes.js';
import careRequestRoutes from './careRequest.routes.js';
import matchRoutes from './match.routes.js';
import sessionRoutes from './session.routes.js';
import paymentRoutes from './payment.routes.js';
import ratingRoutes from './rating.routes.js';
import sosRoutes from './sos.routes.js';
import learningRoutes from './learning.routes.js';
import bookingRoutes from './booking.routes.js';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/caregivers', caregiverRoutes);
router.use('/requests', careRequestRoutes);
router.use('/matches', matchRoutes);
router.use('/sessions', sessionRoutes);
router.use('/payments', paymentRoutes);
router.use('/ratings', ratingRoutes);
router.use('/sos', sosRoutes);
router.use('/learning', learningRoutes);
router.use('/bookings', bookingRoutes);

// Admin
router.get('/admin/analytics', authenticate, requireRole('admin'), adminController.getAnalytics);

export default router;
