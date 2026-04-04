import { sosRepository } from '../repositories/sos.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { SosAlert } from '../models/index.js';
import { logger } from '../utils/logger.js';

export const sosService = {
  async trigger(userId: string, input: {
    session_id?: string;
    location_lat: number;
    location_lng: number;
    address?: string;
  }): Promise<SosAlert> {
    const alert = await sosRepository.create({
      user_id: userId,
      session_id: input.session_id,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      address: input.address,
    });

    // In production: trigger push notification, SMS, or webhook to admins/emergency contacts
    logger.warn('SOS ALERT TRIGGERED', {
      alertId: alert.id,
      userId,
      location: { lat: input.location_lat, lng: input.location_lng },
      sessionId: input.session_id,
    });

    return alert;
  },

  async acknowledge(alertId: string): Promise<SosAlert> {
    const updated = await sosRepository.updateStatus(alertId, 'acknowledged');
    if (!updated) {
      throw new AppError(404, 'SOS alert not found', 'NOT_FOUND');
    }
    return updated;
  },

  async resolve(alertId: string): Promise<SosAlert> {
    const updated = await sosRepository.updateStatus(alertId, 'resolved');
    if (!updated) {
      throw new AppError(404, 'SOS alert not found', 'NOT_FOUND');
    }
    return updated;
  },

  async listActive() {
    return sosRepository.listActive();
  },

  async listAll(page = 1, limit = 20) {
    return sosRepository.listAll(page, limit);
  },
};
