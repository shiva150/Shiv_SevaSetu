import { caregiverRepository } from '../repositories/caregiver.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { CreateCaregiverInput, UpdateCaregiverInput, ListCaregiversQuery } from '../validators/caregiver.schema.js';
import { Caregiver, CaregiverWithUser } from '../models/index.js';

export const caregiverService = {
  async createProfile(userId: string, input: CreateCaregiverInput): Promise<Caregiver> {
    const existing = await caregiverRepository.findByUserId(userId);
    if (existing) {
      // Profile exists (possibly auto-created as stub) — update it with submitted data
      const updated = await caregiverRepository.update(existing.id, {
        skills: input.skills,
        languages: input.languages,
        location_lat: input.location_lat,
        location_lng: input.location_lng,
        location_address: input.location_address,
        id_proof_url: input.id_proof_url,
        photo_url: input.photo_url,
        hourly_rate: input.hourly_rate,
        bio: input.bio,
      });
      return updated ?? existing;
    }

    return caregiverRepository.create({
      user_id: userId,
      skills: input.skills,
      languages: input.languages,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_address: input.location_address,
      id_proof_url: input.id_proof_url,
      photo_url: input.photo_url,
      hourly_rate: input.hourly_rate,
      bio: input.bio,
    });
  },

  async updateProfile(userId: string, input: UpdateCaregiverInput): Promise<Caregiver> {
    const caregiver = await caregiverRepository.findByUserId(userId);
    if (!caregiver) {
      throw new AppError(404, 'Caregiver profile not found', 'PROFILE_NOT_FOUND');
    }

    const updated = await caregiverRepository.update(caregiver.id, input);
    if (!updated) {
      throw new AppError(500, 'Failed to update profile', 'UPDATE_FAILED');
    }

    return updated;
  },

  async getProfile(caregiverId: string): Promise<CaregiverWithUser> {
    const caregiver = await caregiverRepository.findByIdWithUser(caregiverId);
    if (!caregiver) {
      throw new AppError(404, 'Caregiver not found', 'NOT_FOUND');
    }
    return caregiver;
  },

  async getProfileByUserId(userId: string): Promise<Caregiver> {
    const caregiver = await caregiverRepository.findByUserId(userId);
    if (caregiver) return caregiver;

    // Auto-create a stub profile so caregivers don't hit 404 on first visit
    return caregiverRepository.create({
      user_id: userId,
      skills: [],
      languages: [],
    });
  },

  async list(filters: ListCaregiversQuery): Promise<{ data: CaregiverWithUser[]; total: number; page: number; limit: number }> {
    const skills = filters.skills ? filters.skills.split(',').map((s: string) => s.trim()) : undefined;
    const result = await caregiverRepository.listAvailable({
      skills,
      verified: filters.verified === 'true' ? true : filters.verified === 'false' ? false : undefined,
      available: filters.available === 'true' ? true : filters.available === 'false' ? false : undefined,
      lat: filters.lat,
      lng: filters.lng,
      radiusKm: filters.radius_km,
      page: filters.page,
      limit: filters.limit,
    });
    return { ...result, page: filters.page, limit: filters.limit };
  },

  async verify(caregiverId: string): Promise<Caregiver> {
    const updated = await caregiverRepository.update(caregiverId, {
      verified: true,
      approval_status: 'approved',
    });
    if (!updated) {
      throw new AppError(404, 'Caregiver not found', 'NOT_FOUND');
    }
    return updated;
  },

  async reject(caregiverId: string): Promise<void> {
    const caregiver = await caregiverRepository.findById(caregiverId);
    if (!caregiver) {
      throw new AppError(404, 'Caregiver not found', 'NOT_FOUND');
    }
    await caregiverRepository.update(caregiverId, {
      verified: false,
      approval_status: 'rejected',
      availability: false,
    });
  },
};
