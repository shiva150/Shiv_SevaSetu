import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Named routes must come before /:id
router.get('/my', authenticate, bookingController.myBookings);
router.get('/incoming', authenticate, requireRole('caregiver'), bookingController.incomingBookings);

// Create (care seeker only)
router.post('/', authenticate, requireRole('careseeker'), bookingController.create);

// Actions on a specific booking
router.post('/:id/accept', authenticate, requireRole('caregiver'), bookingController.accept);
router.post('/:id/reject', authenticate, requireRole('caregiver'), bookingController.reject);
router.post('/:id/complete', authenticate, requireRole('careseeker'), bookingController.complete);

export default router;
