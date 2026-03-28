import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SOSPayload {
  user_id: string;
  user_name: string;
  location?: { lat: number; lng: number };
  address?: string;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  });
}

export async function triggerSOS(userId: string, userName: string): Promise<void> {
  let location: { lat: number; lng: number } | undefined;
  let address = 'Location unavailable';

  try {
    const pos = await getCurrentPosition();
    location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    address = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
  } catch {
    // Proceed without location — SOS should never be blocked
  }

  await addDoc(collection(db, 'alerts'), {
    user_id: userId,
    user_name: userName,
    location: location || null,
    address,
    timestamp: serverTimestamp(),
    status: 'active',
    type: 'SOS',
  });
}
