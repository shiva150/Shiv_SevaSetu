// ============================================================
// Domain models — mirror the database schema exactly.
// No ORM; these are plain TypeScript interfaces used for
// type-safe query results and service layer contracts.
// ============================================================

export interface User {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  password_hash: string;
  role: 'caregiver' | 'careseeker' | 'admin';
  language: string;
  is_active: boolean;
  onboarding_step: 'personal_info' | 'skills' | 'verification' | 'submitted' | null;
  onboarding_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export type UserPublic = Omit<User, 'password_hash'>;

export interface Caregiver {
  id: string;
  user_id: string;
  skills: string[];
  languages: string[];
  rating: number;
  rating_count: number;
  availability: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  verified: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  id_proof_url: string | null;
  photo_url: string | null;
  hourly_rate: number | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CaregiverWithUser extends Caregiver {
  user_name: string;
  user_phone: string;
  user_email: string | null;
  user_language: string;
}

export interface CareRequest {
  id: string;
  user_id: string;
  skills_required: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  preferred_language: string | null;
  description: string | null;
  hours_needed: number | null;
  budget: number | null;
  status: 'open' | 'matched' | 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface Match {
  id: string;
  caregiver_id: string;
  request_id: string;
  score: number;
  skill_score: number;
  rating_score: number;
  distance_score: number;
  language_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: Date;
}

export interface Session {
  id: string;
  caregiver_id: string;
  request_id: string;
  match_id: string;
  start_time: Date | null;
  end_time: Date | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'locked' | 'completed' | 'released' | 'refunded';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  session_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  status: 'locked' | 'completed' | 'released' | 'refunded' | 'disputed';
  locked_at: Date;
  released_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Rating {
  id: string;
  session_id: string;
  rater_id: string;
  caregiver_id: string;
  score: number;
  feedback: string | null;
  created_at: Date;
}

export interface SosAlert {
  id: string;
  user_id: string;
  session_id: string | null;
  location_lat: number;
  location_lng: number;
  address: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: Date;
  resolved_at: Date | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ContentSection {
  heading: string;
  body: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  category: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  duration_minutes: number | null;
  content_sections: ContentSection[];
  key_takeaways: string[];
  quiz: QuizQuestion[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  quiz_score: number | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface Booking {
  id: string;
  seeker_id: string;
  seeker_name: string;
  caregiver_id: string;       // caregiver profile doc id
  caregiver_user_id: string;  // caregiver's user id (for routing incoming requests)
  caregiver_name: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  description: string | null;
  hours_needed: number | null;
  amount: number | null;      // in SC (ShivCoin)
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}
