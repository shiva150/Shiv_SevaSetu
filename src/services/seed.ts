import { doc, setDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CaregiverProfile, LearningModule, Booking } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const SAMPLE_MODULES: LearningModule[] = [
  { id: 'm1', title: 'Elder Hygiene & Daily Care', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Basics', duration: '15 min', description: 'Essential hygiene practices — bathing, oral care, and grooming for elderly patients.' },
  { id: 'm2', title: 'Emergency Response & First Aid', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Safety', duration: '20 min', description: 'How to handle cardiac events, falls, choking, and other medical emergencies at home.' },
  { id: 'm3', title: 'Effective Communication with Families', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Soft Skills', duration: '10 min', description: 'Building trust through empathetic listening, daily updates, and conflict resolution.' },
  { id: 'm4', title: 'Bedridden Patient Care', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Advanced', duration: '30 min', description: 'Techniques for repositioning, preventing bedsores, and cleaning immobile patients.' },
  { id: 'm5', title: 'Nutrition & Meal Planning', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Health', duration: '15 min', description: 'Preparing balanced meals for elderly patients with diabetes, hypertension, and other conditions.' },
  { id: 'm6', title: 'Understanding Dementia', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Specialized', duration: '25 min', description: 'Recognizing symptoms, managing agitation, sundowning, and maintaining patient dignity.' },
  { id: 'm7', title: 'Medication Management', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Health', duration: '12 min', description: 'Safe storage, scheduling, dosage tracking, and recognizing adverse reactions.' },
  { id: 'm8', title: 'Mobility & Fall Prevention', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Basics', duration: '18 min', description: 'Helping patients walk safely, use walkers and wheelchairs, and prevent falls.' },
  { id: 'm9', title: 'First Aid Certification Course', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Safety', duration: '45 min', description: 'Comprehensive CPR, wound care, burn treatment, and emergency stabilization.' },
  { id: 'm10', title: 'Emotional Support & Mental Health', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Soft Skills', duration: '15 min', description: 'Companionship techniques, recognizing depression, and supporting mental well-being.' },
  { id: 'm11', title: 'Infection Control at Home', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Safety', duration: '10 min', description: 'Hand hygiene, PPE usage, surface disinfection, and preventing cross-contamination.' },
  { id: 'm12', title: 'Palliative & End-of-Life Care', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'Advanced', duration: '20 min', description: 'Pain management, comfort measures, and supporting families through the process.' },
];

export const SAMPLE_CAREGIVERS: CaregiverProfile[] = [
  {
    user_id: 'giver_1', name: 'Anjali Sharma',
    skills: ['Elderly Care', 'First Aid', 'Cooking'],
    languages: ['Hindi', 'English', 'Bhojpuri'],
    rating: 4.92, reviewCount: 187,
    location: { lat: 25.5941, lng: 85.1376, address: 'Patna, Bihar' },
    availability: 'available', hourlyRate: 280, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver1/200/200',
    bio: 'Compassionate caregiver with 8 years of experience in elderly care. Certified in CPR and first aid.',
    completionRate: 0.96, cancellationRate: 0.02, responseTimeMinutes: 12, totalBookings: 195,
  },
  {
    user_id: 'giver_2', name: 'Priya Devi',
    skills: ['Patient Care', 'Medication Management', 'Companionship'],
    languages: ['Hindi', 'Maithili'],
    rating: 4.85, reviewCount: 143,
    location: { lat: 26.1209, lng: 85.8962, address: 'Darbhanga, Bihar' },
    availability: 'available', hourlyRate: 220, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver2/200/200',
    bio: 'Experienced patient care specialist with a focus on post-operative recovery and medication management.',
    completionRate: 0.94, cancellationRate: 0.03, responseTimeMinutes: 18, totalBookings: 152,
  },
  {
    user_id: 'giver_3', name: 'Sunita Verma',
    skills: ['Post-surgery Care', 'Physiotherapy Assist', 'Mobility Support'],
    languages: ['Hindi', 'English'],
    rating: 4.78, reviewCount: 98,
    location: { lat: 25.0961, lng: 85.3131, address: 'Nalanda, Bihar' },
    availability: 'available', hourlyRate: 350, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver3/200/200',
    bio: 'Specialized in post-surgical recovery care with physiotherapy training. Handles wheelchair and walker patients.',
    completionRate: 0.91, cancellationRate: 0.04, responseTimeMinutes: 25, totalBookings: 105,
  },
  {
    user_id: 'giver_4', name: 'Rajesh Kumar',
    skills: ['Dementia Care', 'Companionship', 'Emotional Support'],
    languages: ['Hindi', 'English', 'Bengali'],
    rating: 4.95, reviewCount: 210,
    location: { lat: 24.7914, lng: 85.0002, address: 'Gaya, Bihar' },
    availability: 'busy', hourlyRate: 300, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver4/200/200',
    bio: 'Gentle and patient caregiver specializing in dementia and Alzheimer\'s care. Known for building deep trust with families.',
    completionRate: 0.98, cancellationRate: 0.01, responseTimeMinutes: 8, totalBookings: 215,
  },
  {
    user_id: 'giver_5', name: 'Meena Kumari',
    skills: ['Infant Care', 'Nutrition', 'Childcare'],
    languages: ['Hindi', 'Bhojpuri'],
    rating: 4.70, reviewCount: 76,
    location: { lat: 23.3441, lng: 85.3096, address: 'Ranchi, Jharkhand' },
    availability: 'available', hourlyRate: 200, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver5/200/200',
    bio: 'Mother of three, experienced in infant care, nutrition planning, and early childhood development.',
    completionRate: 0.89, cancellationRate: 0.06, responseTimeMinutes: 35, totalBookings: 82,
  },
  {
    user_id: 'giver_6', name: 'Suresh Singh',
    skills: ['Elderly Care', 'Mobility Support', 'Medical Assist'],
    languages: ['Hindi', 'English', 'Marathi'],
    rating: 4.82, reviewCount: 120,
    location: { lat: 22.7196, lng: 75.8577, address: 'Indore, Madhya Pradesh' },
    availability: 'available', hourlyRate: 260, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver6/200/200',
    bio: 'Former hospital orderly turned professional caregiver. Strong in mobility assistance and medical equipment handling.',
    completionRate: 0.93, cancellationRate: 0.03, responseTimeMinutes: 15, totalBookings: 128,
  },
  {
    user_id: 'giver_7', name: 'Kavita Pal',
    skills: ['Patient Care', 'Cooking', 'Cleaning', 'Companionship'],
    languages: ['Hindi', 'Telugu', 'English'],
    rating: 4.65, reviewCount: 54,
    location: { lat: 17.3850, lng: 78.4867, address: 'Hyderabad, Telangana' },
    availability: 'available', hourlyRate: 190, isVerified: true,
    photoURL: 'https://picsum.photos/seed/giver7/200/200',
    bio: 'Warm and dependable caregiver offering holistic home care including meals and housekeeping.',
    completionRate: 0.87, cancellationRate: 0.07, responseTimeMinutes: 40, totalBookings: 60,
  },
  {
    user_id: 'giver_8', name: 'Amit Das',
    skills: ['Elderly Care', 'First Aid', 'Emotional Support'],
    languages: ['Hindi', 'Bengali', 'English'],
    rating: 4.50, reviewCount: 32,
    location: { lat: 22.5726, lng: 88.3639, address: 'Kolkata, West Bengal' },
    availability: 'busy', hourlyRate: 240, isVerified: false,
    photoURL: 'https://picsum.photos/seed/giver8/200/200',
    bio: 'Caring individual with background in social work. Skilled in eldercare and emotional companionship.',
    completionRate: 0.85, cancellationRate: 0.08, responseTimeMinutes: 50, totalBookings: 38,
  },
  {
    user_id: 'giver_9', name: 'Suman Lata',
    skills: ['Dementia Care', 'Bedridden Care', 'Medication Management'],
    languages: ['Hindi', 'Marathi'],
    rating: 4.88, reviewCount: 165,
    location: { lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra' },
    availability: 'available', hourlyRate: 380, isVerified: false,
    photoURL: 'https://picsum.photos/seed/giver9/200/200',
    bio: 'Specialist in complex care cases — dementia, bedridden patients, and multi-medication schedules.',
    completionRate: 0.95, cancellationRate: 0.02, responseTimeMinutes: 10, totalBookings: 172,
  },
  {
    user_id: 'giver_10', name: 'Vikram Rao',
    skills: ['Physiotherapy Assist', 'Mobility Support', 'Post-surgery Care'],
    languages: ['Hindi', 'Tamil', 'English'],
    rating: 4.73, reviewCount: 89,
    location: { lat: 13.0827, lng: 80.2707, address: 'Chennai, Tamil Nadu' },
    availability: 'available', hourlyRate: 320, isVerified: false,
    photoURL: 'https://picsum.photos/seed/giver10/200/200',
    bio: 'Trained physiotherapy assistant helping patients recover mobility after surgery and injuries.',
    completionRate: 0.90, cancellationRate: 0.05, responseTimeMinutes: 22, totalBookings: 94,
  },
];

const SEEKER_NAMES = ['Rahul Gupta', 'Sita Ram', 'Mohan Lal', 'Geeta Singh', 'Arjun Kapoor'];

function generateBookings(): Booking[] {
  const now = Date.now();
  const day = 86400000;
  return [
    { id: uuidv4(), seeker_id: 'seeker_1', caregiver_id: 'giver_1', caregiver_name: 'Anjali Sharma', seeker_name: 'Rahul Gupta', status: 'completed', timestamp: now - 30 * day, totalAmount: 1120, hours: 4, notes: 'Elderly care for father' },
    { id: uuidv4(), seeker_id: 'seeker_2', caregiver_id: 'giver_2', caregiver_name: 'Priya Devi', seeker_name: 'Sita Ram', status: 'completed', timestamp: now - 20 * day, totalAmount: 880, hours: 4, notes: 'Post-surgery medication management' },
    { id: uuidv4(), seeker_id: 'seeker_1', caregiver_id: 'giver_4', caregiver_name: 'Rajesh Kumar', seeker_name: 'Rahul Gupta', status: 'completed', timestamp: now - 15 * day, totalAmount: 2400, hours: 8, notes: 'Full-day dementia care for grandmother' },
    { id: uuidv4(), seeker_id: 'seeker_3', caregiver_id: 'giver_6', caregiver_name: 'Suresh Singh', seeker_name: 'Mohan Lal', status: 'completed', timestamp: now - 10 * day, totalAmount: 1040, hours: 4, notes: 'Mobility assistance' },
    { id: uuidv4(), seeker_id: 'seeker_4', caregiver_id: 'giver_3', caregiver_name: 'Sunita Verma', seeker_name: 'Geeta Singh', status: 'confirmed', timestamp: now - 3 * day, totalAmount: 1400, hours: 4, notes: 'Physiotherapy for knee replacement' },
    { id: uuidv4(), seeker_id: 'seeker_5', caregiver_id: 'giver_5', caregiver_name: 'Meena Kumari', seeker_name: 'Arjun Kapoor', status: 'pending', timestamp: now - 1 * day, totalAmount: 800, hours: 4, notes: 'Infant care while traveling' },
    { id: uuidv4(), seeker_id: 'seeker_2', caregiver_id: 'giver_7', caregiver_name: 'Kavita Pal', seeker_name: 'Sita Ram', status: 'pending', timestamp: now, totalAmount: 760, hours: 4, notes: 'General patient care' },
    { id: uuidv4(), seeker_id: 'seeker_3', caregiver_id: 'giver_1', caregiver_name: 'Anjali Sharma', seeker_name: 'Mohan Lal', status: 'cancelled', timestamp: now - 25 * day, totalAmount: 1120, hours: 4, notes: 'Cancelled — family plans changed' },
  ];
}

export async function seedDatabase(): Promise<void> {
  // 1. Seed Learning Modules
  for (const m of SAMPLE_MODULES) {
    await setDoc(doc(db, 'learning_modules', m.id), m);
  }

  // 2. Seed Caregivers + their user docs
  for (const giver of SAMPLE_CAREGIVERS) {
    await setDoc(doc(db, 'caregivers', giver.user_id), giver);
    await setDoc(doc(db, 'users', giver.user_id), {
      uid: giver.user_id,
      email: `${giver.name.toLowerCase().replace(/\s/g, '.')}@sevasetu.in`,
      displayName: giver.name,
      role: 'giver',
      createdAt: Date.now(),
    });
  }

  // 3. Seed Seekers
  for (let i = 0; i < SEEKER_NAMES.length; i++) {
    const uid = `seeker_${i + 1}`;
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: `${SEEKER_NAMES[i].toLowerCase().replace(/\s/g, '.')}@example.com`,
      displayName: SEEKER_NAMES[i],
      role: 'seeker',
      createdAt: Date.now(),
    });
  }

  // 4. Seed Bookings + Escrows
  const bookings = generateBookings();
  for (const booking of bookings) {
    await setDoc(doc(db, 'bookings', booking.id), booking);
    await setDoc(doc(db, 'escrows', uuidv4()), {
      booking_id: booking.id,
      amount: booking.totalAmount,
      status: booking.status === 'completed' ? 'released' : booking.status === 'cancelled' ? 'refunded' : 'locked',
      payer_id: booking.seeker_id,
      payee_id: booking.caregiver_id,
      timestamp: booking.timestamp,
    });
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = ['users', 'caregivers', 'bookings', 'learning_modules', 'progress', 'escrows', 'alerts'];
  for (const colName of collections) {
    const snapshot = await getDocs(collection(db, colName));
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, colName, docSnap.id));
    }
  }
}
