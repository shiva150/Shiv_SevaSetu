export type UserRole = 'seeker' | 'giver' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
}

export interface CaregiverProfile {
  user_id: string;
  name: string;
  skills: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  availability: 'available' | 'busy' | 'offline';
  hourlyRate: number;
  isVerified: boolean;
  photoURL?: string;
  bio?: string;
  // Reliability metrics
  completionRate?: number;
  cancellationRate?: number;
  responseTimeMinutes?: number;
  totalBookings?: number;
}

export interface SeekerRequest {
  skills: string[];
  location?: { lat: number; lng: number };
  maxBudget?: number;
  preferredLanguages?: string[];
}

export interface MatchResult {
  caregiver: CaregiverProfile;
  score: number;
  breakdown: {
    skillMatch: number;
    distanceScore: number;
    ratingScore: number;
    reliabilityScore: number;
  };
  explanation: string;
}

export interface Booking {
  id: string;
  seeker_id: string;
  caregiver_id: string;
  caregiver_name?: string;
  seeker_name?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  timestamp: number;
  totalAmount: number;
  hours: number;
  notes?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  video_url: string;
  description: string;
  category: string;
  duration: string;
}

export interface UserProgress {
  user_id: string;
  module_id: string;
  completed: boolean;
  timestamp: number;
}

export interface Escrow {
  id: string;
  booking_id: string;
  amount: number;
  status: 'locked' | 'released' | 'refunded';
  payer_id: string;
  payee_id: string;
  timestamp: number;
}

export interface SOSAlert {
  id: string;
  user_id: string;
  user_name: string;
  location?: {
    lat: number;
    lng: number;
  };
  address?: string;
  timestamp: number;
  status: 'active' | 'resolved';
}

export interface AnalyticsSummary {
  totalCaregivers: number;
  verifiedCaregivers: number;
  pendingVerification: number;
  totalSeekers: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  activeAlerts: number;
}
