import { userRepository } from '../repositories/user.repository.js';
import { caregiverRepository } from '../repositories/caregiver.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { sosRepository } from '../repositories/sos.repository.js';

export interface AnalyticsSummary {
  totalCaregivers: number;
  verifiedCaregivers: number;
  pendingVerification: number;
  totalSeekers: number;
  sessionsByStatus: Record<string, number>;
  totalRevenue: number;
  activeAlerts: number;
}

export const adminService = {
  async getAnalytics(): Promise<AnalyticsSummary> {
    const [
      totalCaregivers,
      verifiedCaregivers,
      pendingVerification,
      totalSeekers,
      sessionsByStatus,
      totalRevenue,
      activeAlerts,
    ] = await Promise.all([
      caregiverRepository.countAll(),
      caregiverRepository.countVerified(),
      caregiverRepository.countPendingVerification(),
      userRepository.countByRole('careseeker'),
      sessionRepository.countByStatus(),
      paymentRepository.totalRevenue(),
      sosRepository.countActive(),
    ]);

    return {
      totalCaregivers,
      verifiedCaregivers,
      pendingVerification,
      totalSeekers,
      sessionsByStatus,
      totalRevenue,
      activeAlerts,
    };
  },
};
