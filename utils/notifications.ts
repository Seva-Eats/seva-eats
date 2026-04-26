import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PERMISSION_ASKED_KEY = 'tracking-notification-permission-asked';
const PERMISSION_GRANTED_KEY = 'tracking-notification-permission-granted';
const DELIVERED_NOTIFIED_KEY = 'tracking-notification-delivered-ids';

type DeliveredNotificationPayload = {
  requestId: string;
  deliveryAddress?: string;
};

export async function configureNotificationsAsync() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tracking-updates', {
      name: 'Tracking Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
}

export async function shouldPromptForTrackingNotifications() {
  const asked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
  return asked !== 'true';
}

export async function markTrackingNotificationsPrompted(granted: boolean) {
  await AsyncStorage.multiSet([
    [PERMISSION_ASKED_KEY, 'true'],
    [PERMISSION_GRANTED_KEY, granted ? 'true' : 'false'],
  ]);
}

export async function requestTrackingNotificationsPermission() {
  const settings = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  const granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  await markTrackingNotificationsPrompted(granted);
  return granted;
}

async function getDeliveredNotifiedIds() {
  const stored = await AsyncStorage.getItem(DELIVERED_NOTIFIED_KEY);
  if (!stored) return [] as string[];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function markDeliveredNotified(requestId: string) {
  const notified = await getDeliveredNotifiedIds();
  if (notified.includes(requestId)) return;
  const updated = [...notified, requestId];
  await AsyncStorage.setItem(DELIVERED_NOTIFIED_KEY, JSON.stringify(updated));
}

export async function notifyMealDelivered(payload: DeliveredNotificationPayload) {
  const settings = await Notifications.getPermissionsAsync();
  const granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) return;

  const notified = await getDeliveredNotifiedIds();
  if (notified.includes(payload.requestId)) return;

  const addressSuffix = payload.deliveryAddress ? ` to ${payload.deliveryAddress}` : '';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Meal delivered',
      body: `Your Seva Eats delivery${addressSuffix} is complete.`,
      sound: 'default',
    },
    trigger: null,
  });

  await markDeliveredNotified(payload.requestId);
}
