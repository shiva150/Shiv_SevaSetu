import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnalyticsSummary } from '../types';

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [caregiversSnap, usersSnap, bookingsSnap, alertsSnap, escrowsSnap] = await Promise.all([
    getDocs(collection(db, 'caregivers')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'bookings')),
    getDocs(collection(db, 'alerts')),
    getDocs(collection(db, 'escrows')),
  ]);

  const caregivers = caregiversSnap.docs.map(d => d.data());
  const users = usersSnap.docs.map(d => d.data());
  const bookings = bookingsSnap.docs.map(d => d.data());

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return {
    totalCaregivers: caregivers.length,
    verifiedCaregivers: caregivers.filter(c => c.isVerified).length,
    pendingVerification: caregivers.filter(c => !c.isVerified).length,
    totalSeekers: users.filter(u => u.role === 'seeker').length,
    totalBookings: bookings.length,
    completedBookings: completedBookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue,
    activeAlerts: alertsSnap.docs.filter(d => d.data().status === 'active').length,
  };
}

export interface MonthlyData {
  name: string;
  bookings: number;
  revenue: number;
}

export async function getMonthlyStats(): Promise<MonthlyData[]> {
  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  const bookings = bookingsSnap.docs.map(d => d.data());

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const last6 = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

    const monthBookings = bookings.filter(b => b.timestamp >= monthStart && b.timestamp < monthEnd);
    const monthRevenue = monthBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    last6.push({
      name: months[d.getMonth()],
      bookings: monthBookings.length,
      revenue: monthRevenue,
    });
  }

  return last6;
}

export interface RegionData {
  city: string;
  count: number;
}

export async function getRegionalDistribution(): Promise<RegionData[]> {
  const caregiversSnap = await getDocs(collection(db, 'caregivers'));
  const caregivers = caregiversSnap.docs.map(d => d.data());

  const cityMap: Record<string, number> = {};
  for (const c of caregivers) {
    const address = c.location?.address || 'Unknown';
    const city = address.split(',')[0].trim();
    cityMap[city] = (cityMap[city] || 0) + 1;
  }

  return Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}
