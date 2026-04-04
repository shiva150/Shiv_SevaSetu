import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service.js';

export const bookingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.createBooking(req.user!.userId, req.body);
      res.status(201).json(booking);
    } catch (err) { next(err); }
  },

  async myBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.getMyBookings(req.user!.userId);
      res.json({ data: bookings });
    } catch (err) { next(err); }
  },

  async incomingBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.getIncomingBookings(req.user!.userId);
      res.json({ data: bookings });
    } catch (err) { next(err); }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.acceptBooking(req.params.id, req.user!.userId);
      res.json(booking);
    } catch (err) { next(err); }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.rejectBooking(req.params.id, req.user!.userId);
      res.json(booking);
    } catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.completeBooking(req.params.id, req.user!.userId);
      res.json(booking);
    } catch (err) { next(err); }
  },
};
