import { careRequestRepository } from '../repositories/careRequest.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { CreateRequestInput, ListRequestsQuery } from '../validators/careRequest.schema.js';
import { CareRequest } from '../models/index.js';

export const careRequestService = {
  async create(userId: string, input: CreateRequestInput): Promise<CareRequest> {
    return careRequestRepository.create({
      user_id: userId,
      skills_required: input.skills_required,
      urgency: input.urgency,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_address: input.location_address,
      preferred_language: input.preferred_language,
      description: input.description,
      hours_needed: input.hours_needed,
      budget: input.budget,
    });
  },

  async getById(id: string): Promise<CareRequest> {
    const request = await careRequestRepository.findById(id);
    if (!request) {
      throw new AppError(404, 'Care request not found', 'NOT_FOUND');
    }
    return request;
  },

  async listByUser(userId: string, filters: ListRequestsQuery): Promise<{ data: CareRequest[]; total: number }> {
    return careRequestRepository.listByUser(userId, filters);
  },

  async updateStatus(id: string, status: string, userId: string): Promise<CareRequest> {
    const request = await careRequestRepository.findById(id);
    if (!request) {
      throw new AppError(404, 'Care request not found', 'NOT_FOUND');
    }
    if (request.user_id !== userId) {
      throw new AppError(403, 'Not authorized to modify this request', 'FORBIDDEN');
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      open: ['matched', 'cancelled'],
      matched: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[request.status]?.includes(status)) {
      throw new AppError(400, `Cannot transition from '${request.status}' to '${status}'`, 'INVALID_TRANSITION');
    }

    const updated = await careRequestRepository.updateStatus(id, status);
    if (!updated) {
      throw new AppError(500, 'Failed to update request status', 'UPDATE_FAILED');
    }
    return updated;
  },

  async cancel(id: string, userId: string): Promise<CareRequest> {
    return this.updateStatus(id, 'cancelled', userId);
  },
};
