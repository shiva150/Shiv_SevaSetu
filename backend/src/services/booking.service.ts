import { bookingRepository } from '../repositories/booking.repository.js';
import { caregiverRepository } from '../repositories/caregiver.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { Booking } from '../models/index.js';

export const bookingService = {
  async createBooking(seekerId: string, input: {
    caregiver_id: string;
    description?: string;
    hours_needed?: number;
    amount?: number;
  }): Promise<Booking> {
    // Validate caregiver exists
    const caregiver = await caregiverRepository.findByIdWithUser(input.caregiver_id);
    if (!caregiver) {
      throw new AppError(404, 'Caregiver not found', 'NOT_FOUND');
    }

    // Validate seeker exists
    const seeker = await userRepository.findById(seekerId);
    if (!seeker) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    // Derive amount from hourly_rate if not provided
    const amount = input.amount ??
      (caregiver.hourly_rate && input.hours_needed
        ? caregiver.hourly_rate * input.hours_needed
        : null);

    return bookingRepository.create({
      seeker_id: seekerId,
      seeker_name: seeker.name,
      caregiver_id: input.caregiver_id,
      caregiver_user_id: caregiver.user_id,
      caregiver_name: caregiver.user_name,
      description: input.description,
      hours_needed: input.hours_needed,
      amount: amount ?? undefined,
    });
  },

  async getMyBookings(seekerId: string): Promise<Booking[]> {
    return bookingRepository.findBySeekerId(seekerId);
  },

  async getIncomingBookings(caregiverUserId: string): Promise<Booking[]> {
    return bookingRepository.findByCaregiverUserId(caregiverUserId);
  },

  async acceptBooking(bookingId: string, caregiverUserId: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }
    if (booking.caregiver_user_id !== caregiverUserId) {
      throw new AppError(403, 'Not authorised to update this booking', 'FORBIDDEN');
    }
    if (booking.status !== 'pending') {
      throw new AppError(400, `Cannot accept a booking with status '${booking.status}'`, 'INVALID_STATUS');
    }
    const updated = await bookingRepository.updateStatus(bookingId, 'accepted');
    return updated!;
  },

  async rejectBooking(bookingId: string, caregiverUserId: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }
    if (booking.caregiver_user_id !== caregiverUserId) {
      throw new AppError(403, 'Not authorised to update this booking', 'FORBIDDEN');
    }
    if (booking.status !== 'pending') {
      throw new AppError(400, `Cannot reject a booking with status '${booking.status}'`, 'INVALID_STATUS');
    }
    const updated = await bookingRepository.updateStatus(bookingId, 'rejected');
    return updated!;
  },

  async completeBooking(bookingId: string, seekerId: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }
    if (booking.seeker_id !== seekerId) {
      throw new AppError(403, 'Not authorised to update this booking', 'FORBIDDEN');
    }
    if (booking.status !== 'accepted') {
      throw new AppError(400, `Cannot complete a booking with status '${booking.status}'`, 'INVALID_STATUS');
    }
    const updated = await bookingRepository.updateStatus(bookingId, 'completed');
    return updated!;
  },
};
