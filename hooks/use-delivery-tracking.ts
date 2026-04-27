import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
    endDeliveryActivity,
    estimateArrivalMinutes,
    startDeliveryActivity,
    updateDeliveryActivity,
    type DeliveryActivityState,
} from '@/lib/activity-tracking';
import { subscribeToDriverLocation } from '@/lib/backend/orders';

interface UseDeliveryTrackingOptions {
  orderId: string;
  driverName: string;
  driverPhone: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  enabled?: boolean;
}

/**
 * Hook to manage Dynamic Island activity for active deliveries
 * Subscribes to real-time driver location updates and updates the activity
 */
export function useDeliveryTracking({
  orderId,
  driverName,
  driverPhone,
  deliveryLatitude,
  deliveryLongitude,
  enabled = true,
}: UseDeliveryTrackingOptions) {
  const subscriptionRef = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to driver location updates
    try {
      subscriptionRef.current = subscribeToDriverLocation(
        orderId,
        async (location) => {
          const estimatedMinutes = estimateArrivalMinutes(
            location.latitude,
            location.longitude,
            deliveryLatitude,
            deliveryLongitude,
            location.speed_mps
          );

          const activityState: DeliveryActivityState = {
            orderId,
            driverName,
            driverPhone,
            driverLatitude: location.latitude,
            driverLongitude: location.longitude,
            deliveryLatitude,
            deliveryLongitude,
            estimatedArrivalMinutes: estimatedMinutes,
            status: estimatedMinutes <= 2 ? 'arriving' : 'en_route',
          };

          // Update the activity
          await updateDeliveryActivity(activityState);
        }
      );

      // Start initial activity
      const initialActivity: DeliveryActivityState = {
        orderId,
        driverName,
        driverPhone,
        driverLatitude: deliveryLatitude,
        driverLongitude: deliveryLongitude,
        deliveryLatitude,
        deliveryLongitude,
        estimatedArrivalMinutes: 15,
        status: 'en_route',
      };

      startDeliveryActivity(initialActivity);

      // Handle app state changes
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        // Cleanup
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe?.();
        }
        subscription.remove();
      };
    } catch (error) {
      console.error('Error setting up delivery tracking:', error);
    }
  }, [orderId, driverName, driverPhone, deliveryLatitude, deliveryLongitude, enabled]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to foreground - activity should still be visible in Dynamic Island
    }
    appStateRef.current = nextAppState;
  };

  // End activity on unmount
  useEffect(() => {
    return () => {
      if (enabled) {
        endDeliveryActivity(orderId);
      }
    };
  }, [orderId, enabled]);
}
