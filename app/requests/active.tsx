import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing } from '@/constants/theme';
import { REQUEST_STATUS_LABELS, useRequests } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function ActiveRequestsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { requests } = useRequests();

  // Filter for active requests (not delivered or cancelled)
  const activeRequests = requests.filter(
    (req) => req.status !== 'delivered' && req.status !== 'cancelled'
  );

  const getRequestIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'search';
      case 'matched':
        return 'person';
      case 'picked_up':
        return 'restaurant';
      case 'on_the_way':
        return 'directions-car';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'restaurant';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'matched':
        return '#3B82F6';
      case 'picked_up':
        return '#8B5CF6';
      case 'on_the_way':
        return '#F97316';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.mutedText;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Active Requests',
          headerShown: false,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Active Requests</Text>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          {activeRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  {
                    backgroundColor: colors.isDark
                      ? 'rgba(249, 115, 22, 0.15)'
                      : 'rgba(249, 115, 22, 0.1)',
                  },
                ]}
              >
                <MaterialIcons name="assignment" size={48} color="#F97316" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No active requests
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
                You don't have any active meal requests at the moment. Start a new
                request to get meals delivered to a shelter.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  { backgroundColor: '#F97316' },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push('/request/location')}
              >
                <MaterialIcons name="add" size={20} color="#FFF8F0" />
                <Text style={styles.emptyButtonText}>Start New Request</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {activeRequests.map((request, index) => (
                <Animated.View 
                  key={request.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.requestCard,
                      {
                        backgroundColor: colors.isDark ? colors.surface : '#FFF8F0',
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => router.push(`/request/${request.id}` as any)}
                  >
                  <View style={styles.requestHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(request.status)}15` },
                      ]}
                    >
                      <MaterialIcons
                        name={getRequestIcon(request.status) as any}
                        size={16}
                        color={getStatusColor(request.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(request.status) },
                        ]}
                      >
                        {REQUEST_STATUS_LABELS[request.status]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestBody}>
                    <View style={styles.requestInfo}>
                      <MaterialIcons
                        name="place"
                        size={18}
                        color={colors.mutedText}
                      />
                      <Text
                        style={[styles.requestLocation, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {request.deliveryAddress?.address ?? 'Location pending'}
                      </Text>
                    </View>

                    {request.volunteerName && request.showVolunteerName && (
                      <View style={styles.requestInfo}>
                        <MaterialIcons
                          name="person"
                          size={18}
                          color={colors.mutedText}
                        />
                        <Text
                          style={[styles.requestVolunteer, { color: colors.text }]}
                        >
                          {request.volunteerName}
                        </Text>
                      </View>
                    )}

                    {request.servingSize && (
                      <View style={styles.requestInfo}>
                        <MaterialIcons
                          name="restaurant"
                          size={18}
                          color={colors.mutedText}
                        />
                        <Text style={[styles.requestMeals, { color: colors.text }]}>
                          {request.servingSize} servings
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.requestFooter}>
                    <Text style={[styles.requestTime, { color: colors.mutedText }]}>
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.mutedText}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.pill,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF8F0',
    letterSpacing: -0.3,
  },

  // Requests List
  requestsList: {
    gap: Spacing.md,
  },
  requestCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  requestBody: {
    gap: Spacing.sm,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requestLocation: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  requestVolunteer: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  requestMeals: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  requestTime: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
