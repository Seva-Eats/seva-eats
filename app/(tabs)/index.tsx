import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { communityStats } from '@/constants/mock-data';
import { Radii, Spacing } from '@/constants/theme';
import { useLocation, useRequests } from '@/context';
import { REQUEST_STATUS_LABELS } from '@/context/RequestContext';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { userLocation, refreshLocation, isLoading } = useLocation();
  const { activeRequest } = useRequests();

  const locationLabel = userLocation?.address?.split(',')[0] ?? 'Set location';

  const handleViewActiveRequest = () => {
    if (!activeRequest) return;
    router.push(`/request/${activeRequest.id}` as any);
  };

  const getRequestMeta = () => {
    if (!activeRequest?.driverNote) return null;
    const lines = activeRequest.driverNote.split('\n');
    const windowLine = lines.find((line) => line.startsWith('Window:'));
    const deliveryLine = lines.find((line) => line.startsWith('Delivery:'));
    return {
      window: windowLine?.replace('Window:', '').trim(),
      delivery: deliveryLine?.replace('Delivery:', '').trim(),
    };
  };

  const requestMeta = getRequestMeta();

  const getRequestIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'search';
      case 'matched': return 'person';
      case 'picked_up': return 'restaurant';
      case 'on_the_way': return 'directions-car';
      case 'delivered': return 'check-circle';
      case 'cancelled': return 'cancel';
      default: return 'restaurant';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.appTitle, { color: colors.text }]}>Seva Eats</Text>
            <Pressable 
              style={({ pressed }) => [
                styles.locationRow,
                pressed && { opacity: 0.6 }
              ]} 
              onPress={refreshLocation}
            >
              <MaterialIcons name="location-on" size={15} color="#F97316" />
              <Text style={[styles.locationText, { color: colors.mutedText }]}>
                {isLoading ? 'Getting location...' : locationLabel}
              </Text>
            </Pressable>
          </View>
          <Pressable 
            style={[styles.profileButton, { backgroundColor: colors.isDark ? colors.surface : '#FFF8F0', borderColor: colors.border }]} 
            onPress={() => router.push('/profile')}
          >
            <MaterialIcons name="account-circle" size={26} color={colors.text} />
          </Pressable>
        </View>

        {/* Community Impact Stats */}
        <View style={[styles.impactCard, { 
          backgroundColor: colors.isDark ? colors.surface : '#FFF8F0',
          borderColor: colors.border,
        }]}>
          <Text style={[styles.impactLabel, { color: colors.mutedText }]}>COMMUNITY IMPACT</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {communityStats.mealsDelivered.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Meals</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {communityStats.familiesServed.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Shelters</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {communityStats.activeVolunteers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Volunteers</Text>
            </View>
          </View>
        </View>

        {/* Active Meal Request Banner */}
        {activeRequest && (
          <Pressable 
            style={[styles.activeRequestBanner, { backgroundColor: colors.success }]} 
            onPress={handleViewActiveRequest}
          >
            <View style={styles.activeOrderLeft}>
              <View style={styles.requestIconPulse}>
                <MaterialIcons 
                  name={getRequestIcon(activeRequest.status) as any} 
                  size={20} 
                  color="#FFF8F0" 
                />
              </View>
              <View style={styles.activeOrderText}>
                <Text style={styles.activeOrderTitle}>
                  {REQUEST_STATUS_LABELS[activeRequest.status]}
                </Text>
                <Text style={styles.activeOrderSubtitle}>
                  {activeRequest.status === 'pending'
                    ? 'Matching a volunteer...'
                    : activeRequest.showVolunteerName && activeRequest.volunteerName
                      ? `${activeRequest.volunteerName} is on it`
                      : 'Tap to view details'
                  }
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFF8F0" />
          </Pressable>
        )}

        {activeRequest && (
          <View style={[styles.statusCard, { 
            backgroundColor: colors.isDark ? colors.surface : '#FFF8F0',
            borderColor: colors.border,
          }]}>
            <View style={styles.statusHeader}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>Delivery status</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={[styles.liveText, { color: '#F97316' }]}>Live</Text>
              </View>
            </View>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {REQUEST_STATUS_LABELS[activeRequest.status]}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Window</Text>
                <Text style={[styles.statusText, { color: colors.text }]}>{requestMeta?.window ?? 'TBD'}</Text>
              </View>
              <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statusItem}>
                <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Drop-off</Text>
                <Text style={[styles.statusText, { color: colors.text }]}>{requestMeta?.delivery ?? 'TBD'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Start a Request Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Start a request</Text>

        <Pressable
          style={({ pressed }) => [
            styles.requestCard,
            { 
              backgroundColor: colors.isDark ? colors.surface : '#FFF8F0',
              borderColor: colors.border,
            },
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => router.push('/request/location')}
        >
          <View style={[styles.requestIconBox, { backgroundColor: colors.isDark ? 'rgba(251, 146, 60, 0.15)' : '#FFF7ED' }]}>
            <MaterialIcons name="restaurant" size={26} color="#F97316" />
          </View>
          <View style={styles.requestContent}>
            <Text style={[styles.requestTitle, { color: colors.text }]}>Request a shelter drop-off</Text>
            <Text style={[styles.requestDesc, { color: colors.mutedText }]}>
              Request a free langar meal for a partner shelter or community drop-off
            </Text>
          </View>
          <MaterialIcons name="arrow-forward" size={22} color={colors.mutedText} />
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Beta Access Card
  betaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  betaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  betaContent: {
    flex: 1,
  },
  betaTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  betaSubtitle: {
    fontSize: 13,
    letterSpacing: -0.1,
  },

  // Community Impact Card
  impactCard: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },

  // Active Request Banner
  activeRequestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  requestIconPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,248,240,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  activeOrderText: {
    flex: 1,
  },
  activeOrderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF8F0',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  activeOrderSubtitle: {
    fontSize: 13,
    color: 'rgba(255,248,240,0.85)',
    letterSpacing: -0.1,
  },

  // Status Card
  statusCard: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statusDivider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.md,
  },

  // Start a Request Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  requestIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  requestDesc: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.1,
  },

  // How it Works Card
  howItWorksCard: {
    padding: Spacing.xl,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  howItWorksTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.lg,
  },
  stepsContainer: {
    gap: Spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF8F0',
    letterSpacing: 0.3,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
});
