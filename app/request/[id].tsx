import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Shadows, Spacing } from '@/constants/theme';
import { REQUEST_STATUS_LABELS, useRequests, type MealRequestStatus } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { generateDeliveryRoute, type Coordinate } from '@/lib/pathfinding';
import {
    markTrackingNotificationsPrompted,
    requestTrackingNotificationsPermission,
    shouldPromptForTrackingNotifications,
} from '@/utils/notifications';

// Progress steps configuration (simplified to 4 key steps)
const PROGRESS_STEPS: { status: MealRequestStatus; icon: string; label: string }[] = [
  { status: 'pending', icon: 'search', label: 'Finding Driver' },
  { status: 'matched', icon: 'verified', label: 'Driver Matched' },
  { status: 'picked_up', icon: 'directions-car', label: 'On the Way' },
  { status: 'delivered', icon: 'check-circle', label: 'Delivered' },
];

function getStepIndex(status: MealRequestStatus): number {
  const index = PROGRESS_STEPS.findIndex((s) => s.status === status);
  return index >= 0 ? index : 0;
}

// Animated pulsing dot for active step
function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: color,
  }));

  return (
    <Animated.View style={[styles.pulsingDot, animatedStyle]} />
  );
}

// Progress Step Component (Compact Horizontal)
function ProgressStep({
  step,
  index,
  currentIndex,
  isLast,
  colors,
}: {
  step: typeof PROGRESS_STEPS[0];
  index: number;
  currentIndex: number;
  isLast: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const isCompleted = index < currentIndex;
  const isActive = index === currentIndex;

  return (
    <View style={styles.compactStep}>
      {/* Step Circle with Icon */}
      <View style={styles.compactStepCircleContainer}>
        {isActive && <PulsingDot color={colors.accent} />}
        <View
          style={[
            styles.compactStepCircle,
            { backgroundColor: colors.isDark ? '#374151' : '#F3F4F6' },
            isCompleted && styles.compactStepCircleCompleted,
            isActive && { backgroundColor: colors.accent },
          ]}
        >
          <MaterialIcons
            name={isCompleted ? 'check' : (step.icon as any)}
            size={isCompleted ? 14 : 18}
            color={isCompleted || isActive ? '#FFF8F0' : colors.mutedText}
          />
        </View>
      </View>

      {/* Step Label Below */}
      <View style={styles.compactStepLabelContainer}>
        <Text
          style={[
            styles.compactStepLabel,
            { color: colors.mutedText },
            isCompleted && { color: '#059669', fontWeight: '600' },
            isActive && { color: colors.text, fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          {step.label}
        </Text>
        {isActive && (
          <View style={[styles.activePulse, { backgroundColor: colors.accent }]} />
        )}
      </View>

      {/* Connecting Line (Horizontal) */}
      {!isLast && (
        <View
          style={[
            styles.compactStepConnector,
            { backgroundColor: colors.isDark ? '#374151' : '#E5E7EB' },
            isCompleted && { backgroundColor: '#059669' },
          ]}
        />
      )}
    </View>
  );
}

  // Real Map Component with route
function RouteMapView({
  pickupLocation,
  deliveryLocation,
  volunteerLocation,
  status,
  colors,
  onExpand,
  routeCoordinates,
  isLoadingRoute,
}: {
  pickupLocation?: { latitude: number; longitude: number; address: string };
  deliveryLocation: { latitude: number; longitude: number; address: string };
  volunteerLocation?: { latitude: number; longitude: number };
  status: MealRequestStatus;
  colors: ReturnType<typeof useThemeColors>;
  onExpand: () => void;
  routeCoordinates: Coordinate[];
  isLoadingRoute: boolean;
}) {
  // Default pickup location if not set (use a Hub in Brampton area)
  const pickup = pickupLocation ?? {
    latitude: 43.7315,
    longitude: -79.7624,
    address: 'Brampton Hub',
  };

  // Calculate map region to show both points
  const midLat = (pickup.latitude + deliveryLocation.latitude) / 2;
  const midLng = (pickup.longitude + deliveryLocation.longitude) / 2;
  const latDelta = Math.abs(pickup.latitude - deliveryLocation.latitude) * 1.8;
  const lngDelta = Math.abs(pickup.longitude - deliveryLocation.longitude) * 1.8;

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(latDelta, 0.02),
          longitudeDelta: Math.max(lngDelta, 0.02),
        }}
      >
        {/* Pickup Marker (Distribution Hub) */}
        <Marker
          coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
          title="Distribution Hub"
          description={pickup.address}
        >
          <View style={[styles.markerPickup, { backgroundColor: colors.accent }]}>
            <MaterialIcons name="storefront" size={16} color="#FFF8F0" />
          </View>
        </Marker>

        {/* Delivery Marker */}
        <Marker
          coordinate={{
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
          }}
          title="Your Location"
          description={deliveryLocation.address}
        >
          <View style={styles.markerDelivery}>
            <MaterialIcons name="home" size={16} color="#FFF8F0" />
          </View>
        </Marker>

        {/* Driver Marker (when on the way) */}
        {volunteerLocation && (status === 'on_the_way' || status === 'picked_up') && (
          <Marker
            coordinate={volunteerLocation}
            title="Driver"
          >
            <View style={[styles.markerVolunteer, { backgroundColor: colors.accent }]}>
              <MaterialIcons name="directions-car" size={16} color="#FFF8F0" />
            </View>
          </Marker>
        )}

        {/* Optimized Route Line */}
        {!isLoadingRoute && routeCoordinates.length > 1 && (
          <>
            {/* Background line for depth */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.15)'}
              strokeWidth={6}
            />
            {/* Main route line */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.accent}
              strokeWidth={3}
              lineDashPattern={[8, 5]}
            />
          </>
        )}
      </MapView>

      {/* Expand Button */}
      <Pressable
        style={[styles.expandButton, { backgroundColor: colors.background }]}
        onPress={onExpand}
      >
        <MaterialIcons name="fullscreen" size={24} color={colors.text} />
      </Pressable>

      {/* Route Info Overlay */}
      <View style={[styles.mapOverlay, { backgroundColor: colors.isDark ? 'rgba(26,31,37,0.95)' : 'rgba(255,248,240,0.95)' }]}>
        <View style={styles.mapRoute}>
          <View style={styles.mapRoutePoint}>
            <MaterialIcons name="place" size={16} color={colors.accent} />
            <Text style={[styles.mapRouteText, { color: colors.mutedText }]} numberOfLines={1}>
              {pickup.address}
            </Text>
          </View>
          <View style={[styles.mapRouteLine, { backgroundColor: colors.border }]} />
          <View style={styles.mapRoutePoint}>
            <MaterialIcons name="home" size={16} color="#059669" />
            <Text style={[styles.mapRouteText, { color: colors.mutedText }]} numberOfLines={1}>
              {deliveryLocation.address}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RequestTrackingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cancelRequest, requests } = useRequests();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [optimizedRouteCoordinates, setOptimizedRouteCoordinates] = useState<Coordinate[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Get fresh request data on each render
  const request = requests.find((r) => r.id === id);

  useEffect(() => {
    if (!request) {
      // Request not found - go back
      router.back();
    }
  }, [request, router]);

  // Load optimized route
  useEffect(() => {
    if (!request) return;

    const loadRoute = async () => {
      try {
        setIsLoadingRoute(true);
        const pickup = request.gurdwaraLocation ?? {
          latitude: 43.7315,
          longitude: -79.7624,
        };

        const route = await generateDeliveryRoute(
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: request.deliveryAddress.latitude, longitude: request.deliveryAddress.longitude },
          request.volunteerLocation
        );
        setOptimizedRouteCoordinates(route);
      } catch (error) {
        console.error('Error generating route:', error);
        // Fallback to direct route
        setOptimizedRouteCoordinates([
          request.gurdwaraLocation ?? {
            latitude: 43.7315,
            longitude: -79.7624,
          },
          ...(request.volunteerLocation ? [request.volunteerLocation] : []),
          {
            latitude: request.deliveryAddress.latitude,
            longitude: request.deliveryAddress.longitude,
          },
        ]);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    loadRoute();
  }, [request]);

  useEffect(() => {
    let isActive = true;

    const promptForNotifications = async () => {
      if (!request) return;
      if (request.status === 'delivered' || request.status === 'cancelled') return;

      const shouldPrompt = await shouldPromptForTrackingNotifications();
      if (!shouldPrompt || !isActive) return;

      Alert.alert(
        'Enable delivery updates?',
        'We can notify you when your meal is delivered.',
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => {
              void markTrackingNotificationsPrompted(false);
            },
          },
          {
            text: 'Enable',
            onPress: () => {
              void requestTrackingNotificationsPermission();
            },
          },
        ]
      );
    };

    void promptForNotifications();

    return () => {
      isActive = false;
    };
  }, [request]);

  if (!request) {
    return null;
  }

  const currentStepIndex = getStepIndex(request.status);
  const isDelivered = request.status === 'delivered';
  const isCancelled = request.status === 'cancelled';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this meal request?',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelRequest(request.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  // Calculate ETA
  const etaText = request.estimatedDelivery
    ? `${request.estimatedDelivery.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : 'Calculating...';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isDelivered ? 'Delivered!' : isCancelled ? 'Cancelled' : 'Tracking'}
        </Text>
        <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
          <MaterialIcons name="account-circle" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Animated.View
          entering={FadeIn.delay(100)}
          style={[styles.statusCard, { backgroundColor: colors.surface }]}
        >
          {isDelivered ? (
            <>
              <View style={styles.deliveredIcon}>
                <MaterialIcons name="check-circle" size={64} color="#059669" />
              </View>
              <Text style={[styles.deliveredTitle, { color: '#059669' }]}>Meal Delivered!</Text>
              <Text style={[styles.deliveredSubtitle, { color: colors.mutedText }]}>
                Thank you for using Seva Eats. We hope you enjoy your meal!
              </Text>
            </>
          ) : isCancelled ? (
            <>
              <View style={styles.cancelledIcon}>
                <MaterialIcons name="cancel" size={64} color="#DC2626" />
              </View>
              <Text style={styles.cancelledTitle}>Request Cancelled</Text>
              <Text style={[styles.cancelledSubtitle, { color: colors.mutedText }]}>
                Your meal request has been cancelled.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.statusLabel, { color: colors.text }]}>
                {REQUEST_STATUS_LABELS[request.status]}
              </Text>
              <View style={styles.etaRow}>
                <MaterialIcons name="schedule" size={20} color={colors.accent} />
                <Text style={[styles.etaText, { color: colors.mutedText }]}>
                  Estimated arrival: <Text style={[styles.etaBold, { color: colors.text }]}>{etaText}</Text>
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Progress Tracker - Horizontal Compact */}
        {!isCancelled && (
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={[
              styles.compactProgressCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                ...(colors.isDark ? Shadows.dark.card : Shadows.light.card),
              },
            ]}
          >
            <Text style={[styles.compactProgressTitle, { color: colors.text }]}>Delivery Progress</Text>
            <View style={styles.progressStepsContainer}>
              {PROGRESS_STEPS.map((step, index) => (
                <ProgressStep
                  key={step.status}
                  step={step}
                  index={index}
                  currentIndex={currentStepIndex}
                  isLast={index === PROGRESS_STEPS.length - 1}
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Map Preview */}
        {!isDelivered && !isCancelled && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <RouteMapView
              pickupLocation={request.gurdwaraLocation}
              deliveryLocation={request.deliveryAddress}
              volunteerLocation={request.volunteerLocation}
              status={request.status}
              colors={colors}
              onExpand={() => setIsMapExpanded(true)}
              routeCoordinates={optimizedRouteCoordinates}
              isLoadingRoute={isLoadingRoute}
            />
          </Animated.View>
        )}

        {/* Support / Driver Info (privacy-first) */}
        {!isDelivered && !isCancelled && (
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={[
              styles.volunteerCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                ...(colors.isDark ? Shadows.dark.card : Shadows.light.card),
              },
            ]}
          >
            <View style={[styles.volunteerAvatar, { backgroundColor: colors.isDark ? '#181A18' : '#EEF2FF' }]}>
              <MaterialIcons name={request.showVolunteerName ? 'person' : 'support-agent'} size={24} color={colors.accent} />
            </View>
            <View style={styles.volunteerInfo}>
              <Text style={[styles.volunteerLabel, { color: colors.mutedText }]}>
                {request.showVolunteerName ? 'Your Driver' : 'Need help?'}
              </Text>
              <Text style={[styles.volunteerName, { color: colors.text }]}>
                {request.showVolunteerName && request.volunteerName ? request.volunteerName : 'Contact support'}
              </Text>
            </View>
            <Pressable
              style={[styles.callButton, { backgroundColor: colors.accent }]}
              onPress={() => Alert.alert('Support', 'A support specialist will reach out shortly.')}
            >
              <MaterialIcons name="message" size={20} color="#FFF8F0" />
            </Pressable>
          </Animated.View>
        )}

        {/* Request Details */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={[styles.detailsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <Text style={[styles.detailsTitle, { color: colors.text }]}>Request Details</Text>

          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={18} color={colors.mutedText} />
            <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Name</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{request.recipientName}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={18} color={colors.mutedText} />
            <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Phone</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{request.recipientPhone}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={18} color={colors.mutedText} />
            <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Delivery to</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
              {request.deliveryAddress.address}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="group" size={18} color={colors.mutedText} />
            <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Serving size</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{request.servingSize} servings</Text>
          </View>
        </Animated.View>

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {isDelivered || isCancelled ? (
          <Pressable style={[styles.homeButton, { backgroundColor: colors.accent }]} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </Pressable>
        )}
      </View>

      {/* Fullscreen Map Modal */}
      <Modal visible={isMapExpanded} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={[styles.fullscreenMapContainer, { backgroundColor: colors.background }]}>
          <MapView
            style={styles.fullscreenMap}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude:
                ((request.gurdwaraLocation?.latitude ?? 43.7315) + request.deliveryAddress.latitude) / 2,
              longitude:
                ((request.gurdwaraLocation?.longitude ?? -79.7624) + request.deliveryAddress.longitude) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Pickup Marker */}
            <Marker
              coordinate={{
                latitude: request.gurdwaraLocation?.latitude ?? 43.7315,
                longitude: request.gurdwaraLocation?.longitude ?? -79.7624,
              }}
              title={request.gurdwaraName ?? 'Pickup'}
            >
              <View style={[styles.markerPickup, { backgroundColor: colors.accent }]}>
                <MaterialIcons name="storefront" size={16} color="#FFF8F0" />
              </View>
            </Marker>

            {/* Delivery Marker */}
            <Marker
              coordinate={{
                latitude: request.deliveryAddress.latitude,
                longitude: request.deliveryAddress.longitude,
              }}
              title="Your Location"
            >
              <View style={styles.markerDelivery}>
                <MaterialIcons name="home" size={16} color="#FFF8F0" />
              </View>
            </Marker>

            {/* Driver Marker */}
            {request.volunteerLocation && request.status === 'on_the_way' && (
              <Marker coordinate={request.volunteerLocation} title="Driver">
                <View style={[styles.markerVolunteer, { backgroundColor: colors.accent }]}>
                  <MaterialIcons name="directions-car" size={16} color="#FFF8F0" />
                </View>
              </Marker>
            )}

            {/* Route */}
            {optimizedRouteCoordinates.length > 1 && (
              <>
                {/* Background line for depth */}
                <Polyline
                  coordinates={optimizedRouteCoordinates}
                  strokeColor={colors.isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.15)'}
                  strokeWidth={6}
                />
                {/* Main route line */}
                <Polyline
                  coordinates={optimizedRouteCoordinates}
                  strokeColor={colors.accent}
                  strokeWidth={3}
                  lineDashPattern={[8, 5]}
                />
              </>
            )}
          </MapView>

          {/* Close Button */}
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={() => setIsMapExpanded(false)}
          >
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statusCard: {
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  etaText: {
    fontSize: 14,
  },
  etaBold: {
    fontWeight: '600',
  },
  deliveredIcon: {
    marginBottom: Spacing.md,
  },
  deliveredTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  deliveredSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelledIcon: {
    marginBottom: Spacing.md,
  },
  cancelledTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: Spacing.sm,
  },
  cancelledSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 60,
  },
  // NEW COMPACT STYLES
  compactProgressCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  compactProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  progressStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  compactStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  compactStepCircleContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  compactStepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  compactStepCircleCompleted: {
    backgroundColor: '#059669',
  },
  compactStepLabelContainer: {
    alignItems: 'center',
    gap: 4,
  },
  compactStepLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  activePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  compactStepConnector: {
    position: 'absolute',
    height: 3,
    top: 24,
    left: '50%',
    right: '-50%',
    borderRadius: 1.5,
  },
  stepCircleContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulsingDot: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: '#059669',
  },
  stepContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepLabelCompleted: {
    color: '#059669',
    fontWeight: '600',
  },
  stepActiveHint: {
    fontSize: 12,
    marginTop: 2,
  },
  stepLine: {
    position: 'absolute',
    left: 21,
    top: 44,
    bottom: -8,
    width: 2,
  },
  stepLineInner: {
    flex: 1,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#059669',
  },
  mapContainer: {
    height: 200,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  mapRoute: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapRoutePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  mapRouteLine: {
    width: 40,
    height: 2,
    marginHorizontal: Spacing.sm,
  },
  mapRouteText: {
    fontSize: 11,
    flex: 1,
  },
  markerPickup: {
    padding: 8,
    borderRadius: 20,
  },
  markerDelivery: {
    backgroundColor: '#059669',
    padding: 8,
    borderRadius: 20,
  },
  markerVolunteer: {
    padding: 8,
    borderRadius: 20,
  },
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  volunteerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volunteerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  volunteerLabel: {
    fontSize: 12,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  detailLabel: {
    width: 80,
    fontSize: 13,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  homeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF8F0',
  },
  fullscreenMapContainer: {
    flex: 1,
  },
  fullscreenMap: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
