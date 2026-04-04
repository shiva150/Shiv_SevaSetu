import { paymentRepository } from '../repositories/payment.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { Payment } from '../models/index.js';

/**
 * Escrow-like payment flow:
 *   locked → completed → released
 *   locked → refunded (on cancel)
 *   locked → disputed (manual intervention)
 */
export const paymentService = {
  async getBySession(sessionId: string): Promise<Payment> {
    const payment = await paymentRepository.findBySessionId(sessionId);
    if (!payment) {
      throw new AppError(404, 'Payment not found for this session', 'NOT_FOUND');
    }
    return payment;
  },

  /**
   * Release funds from escrow to the caregiver.
   * Only after session is completed and payment is in 'completed' state.
   */
  async releaseFunds(sessionId: string, userId: string): Promise<Payment> {
    const payment = await paymentRepository.findBySessionId(sessionId);
    if (!payment) {
      throw new AppError(404, 'Payment not found', 'NOT_FOUND');
    }

    // Only the payer (care seeker) can release funds
    if (payment.payer_id !== userId) {
      throw new AppError(403, 'Only the payer can release funds', 'FORBIDDEN');
    }

    if (payment.status !== 'completed') {
      throw new AppError(400, `Cannot release funds from '${payment.status}' status`, 'INVALID_STATUS');
    }

    const updated = await paymentRepository.updateStatus(payment.id, 'released');
    if (!updated) {
      throw new AppError(500, 'Failed to release funds', 'RELEASE_FAILED');
    }

    await sessionRepository.updatePaymentStatus(sessionId, 'released');
    return updated;
  },

  async disputePayment(sessionId: string, userId: string): Promise<Payment> {
    const payment = await paymentRepository.findBySessionId(sessionId);
    if (!payment) {
      throw new AppError(404, 'Payment not found', 'NOT_FOUND');
    }

    if (payment.payer_id !== userId && payment.payee_id !== userId) {
      throw new AppError(403, 'Not authorized', 'FORBIDDEN');
    }

    if (!['locked', 'completed'].includes(payment.status)) {
      throw new AppError(400, 'Cannot dispute this payment', 'INVALID_STATUS');
    }

    const updated = await paymentRepository.updateStatus(payment.id, 'disputed');
    return updated!;
  },

  /**
   * Admin: resolve a dispute by releasing or refunding.
   */
  async resolveDispute(paymentId: string, resolution: 'released' | 'refunded'): Promise<Payment> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new AppError(404, 'Payment not found', 'NOT_FOUND');
    }
    if (payment.status !== 'disputed') {
      throw new AppError(400, 'Payment is not in disputed state', 'INVALID_STATUS');
    }

    const updated = await paymentRepository.updateStatus(paymentId, resolution);
    if (!updated) {
      throw new AppError(500, 'Failed to resolve dispute', 'RESOLVE_FAILED');
    }

    await sessionRepository.updatePaymentStatus(payment.session_id, resolution);
    return updated;
  },

  async listUserPayments(userId: string, page = 1, limit = 20) {
    return paymentRepository.listByUser(userId, page, limit);
  },

  async getTotalRevenue(): Promise<number> {
    return paymentRepository.totalRevenue();
  },
};
