import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PERMISSION_ASKED_KEY = 'tracking-notification-permission-asked';
const PERMISSION_GRANTED_KEY = 'tracking-notification-permission-granted';
const DELIVERED_NOTIFIED_KEY = 'tracking-notification-delivered-ids';
const STATUS_NOTIFIED_KEY = 'tracking-notification-status-ids';
const TRACKING_CHANNEL_ID = 'tracking-updates';

export const REQUEST_STATUS_NOTIFICATION_COPY = {
  matched: {
    title: 'Driver assigned',
    body: 'A volunteer has accepted your request.',
  },
  picked_up: {
    title: 'Meal picked up',
    body: 'Your meal is leaving the hub now.',
  },
  on_the_way: {
    title: 'On the way',
    body: 'Your meal is on the road to you.',
  },
  delivered: {
    title: 'Meal delivered',
    body: 'Your Seva Eats delivery is complete.',
  },
} as const;

type TrackableStatus = keyof typeof REQUEST_STATUS_NOTIFICATION_COPY;

type DeliveredNotificationPayload = {
  requestId: string;
  deliveryAddress?: string;
};

export async function configureNotificationsAsync() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TRACKING_CHANNEL_ID, {
      name: 'Tracking Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
}

async function isNotificationsGranted() {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
  );
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
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TRACKING_CHANNEL_ID, {
      name: 'Tracking Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

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

async function getStatusNotifiedIds() {
  const stored = await AsyncStorage.getItem(STATUS_NOTIFIED_KEY);
  if (!stored) return {} as Record<string, TrackableStatus[]>;
  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

async function markStatusNotified(requestId: string, status: TrackableStatus) {
  const notifiedMap = await getStatusNotifiedIds();
  const current = notifiedMap[requestId] ?? [];
  if (current.includes(status)) return;
  const updated = {
    ...notifiedMap,
    [requestId]: [...current, status],
  };
  await AsyncStorage.setItem(STATUS_NOTIFIED_KEY, JSON.stringify(updated));
}

async function hasStatusBeenNotified(requestId: string, status: TrackableStatus) {
  const notifiedMap = await getStatusNotifiedIds();
  const statuses = notifiedMap[requestId] ?? [];
  return statuses.includes(status);
}

export async function notifyMealDelivered(payload: DeliveredNotificationPayload) {
  const granted = await isNotificationsGranted();
  if (!granted) return;

  const notified = await getDeliveredNotifiedIds();
  if (notified.includes(payload.requestId)) return;

  const addressSuffix = payload.deliveryAddress ? ` to ${payload.deliveryAddress}` : '';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Meal delivered',
      body: `Your Seva Eats delivery${addressSuffix} is complete.`,
      sound: 'default',
      channelId: Platform.OS === 'android' ? TRACKING_CHANNEL_ID : undefined,
      data: {
        type: 'request.delivered',
        requestId: payload.requestId,
      },
    },
    trigger: null,
  });

  await markDeliveredNotified(payload.requestId);
}

export async function notifyRequestStatusUpdate(payload: {
  requestId: string;
  status: TrackableStatus;
  deliveryAddress?: string;
}) {
  const granted = await isNotificationsGranted();
  if (!granted) return;

  const alreadyNotified = await hasStatusBeenNotified(payload.requestId, payload.status);
  if (alreadyNotified) return;

  const copy = REQUEST_STATUS_NOTIFICATION_COPY[payload.status];
  const addressSuffix = payload.deliveryAddress ? ` to ${payload.deliveryAddress}` : '';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: `${copy.body}${payload.status === 'delivered' ? addressSuffix : ''}`,
      sound: 'default',
      channelId: Platform.OS === 'android' ? TRACKING_CHANNEL_ID : undefined,
      data: {
        type: `request.${payload.status}`,
        requestId: payload.requestId,
      },
    },
    trigger: null,
  });

  await markStatusNotified(payload.requestId, payload.status);
}
