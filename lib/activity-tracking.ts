import { NativeModules, Platform } from 'react-native';

/**
 * iOS Dynamic Island Activity tracking for live delivery updates
 * This module manages Live Activities on iOS 16+ devices
 */

const { ActivityTracking } = NativeModules;

export interface DeliveryActivityState {
  orderId: string;
  driverName: string;
  driverPhone: string;
  driverLatitude: number;
  driverLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  estimatedArrivalMinutes: number;
  status: 'finding_driver' | 'matched' | 'en_route' | 'arriving';
}

/**
 * Start a Live Activity on iOS Dynamic Island
 */
export async function startDeliveryActivity(state: DeliveryActivityState): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    if (!ActivityTracking) {
      console.warn('ActivityTracking native module not available');
      return;
    }

    await ActivityTracking.startDeliveryActivity({
      orderId: state.orderId,
      driverName: state.driverName,
      driverPhone: state.driverPhone,
      driverLatitude: state.driverLatitude,
      driverLongitude: state.driverLongitude,
      deliveryLatitude: state.deliveryLatitude,
      deliveryLongitude: state.deliveryLongitude,
      estimatedArrivalMinutes: state.estimatedArrivalMinutes,
      status: state.status,
    });
  } catch (error) {
    console.error('Failed to start delivery activity:', error);
  }
}

/**
 * Update an ongoing Live Activity
 */
export async function updateDeliveryActivity(state: DeliveryActivityState): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    if (!ActivityTracking) {
      console.warn('ActivityTracking native module not available');
      return;
    }

    await ActivityTracking.updateDeliveryActivity({
      orderId: state.orderId,
      driverName: state.driverName,
      driverPhone: state.driverPhone,
      driverLatitude: state.driverLatitude,
      driverLongitude: state.driverLongitude,
      deliveryLatitude: state.deliveryLatitude,
      deliveryLongitude: state.deliveryLongitude,
      estimatedArrivalMinutes: state.estimatedArrivalMinutes,
      status: state.status,
    });
  } catch (error) {
    console.error('Failed to update delivery activity:', error);
  }
}

/**
 * End a Live Activity
 */
export async function endDeliveryActivity(orderId: string): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    if (!ActivityTracking) {
      console.warn('ActivityTracking native module not available');
      return;
    }

    await ActivityTracking.endDeliveryActivity(orderId);
  } catch (error) {
    console.error('Failed to end delivery activity:', error);
  }
}

/**
 * Calculate distance in kilometers between two coordinates
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate arrival time in minutes based on distance and average speed
 */
export function estimateArrivalMinutes(
  driverLatitude: number,
  driverLongitude: number,
  deliveryLatitude: number,
  deliveryLongitude: number,
  speed_mps: number = 12 // ~43 km/h average
): number {
  const distanceKm = calculateDistance(
    driverLatitude,
    driverLongitude,
    deliveryLatitude,
    deliveryLongitude
  );
  const speedKmh = speed_mps * 3.6;
  const speedKmhWithBuffer = Math.max(speedKmh, 20); // minimum 20 km/h estimate
  const minutes = Math.ceil((distanceKm / speedKmhWithBuffer) * 60);
  return Math.max(1, Math.min(minutes, 60)); // 1-60 minutes
}
