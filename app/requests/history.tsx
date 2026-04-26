import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing } from '@/constants/theme';
import { REQUEST_STATUS_LABELS, useRequests } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function RequestHistoryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { requests } = useRequests();

  // Filter for completed requests (delivered or cancelled)
  const completedRequests = requests
    .filter((req) => req.status === 'delivered' || req.status === 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return '#10B981';
    if (status === 'cancelled') return '#EF4444';
    return colors.mutedText;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return 'check-circle';
    if (status === 'cancelled') return 'cancel';
    return 'help-outline';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Request History',
          headerShown: false,
        }}
      />
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        {/* Header */}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Request History
          </Text>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={24} color={colors.text} />
          </Pressable>
        </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        {completedRequests.length === 0 ? (
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
              <MaterialIcons name="history" size={48} color="#F97316" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No request history
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
              You haven't completed any meal requests yet. Your delivered and
              cancelled requests will appear here.
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
            {completedRequests.map((request) => (
              <Pressable
                key={request.id}
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
                      name={getStatusIcon(request.status) as any}
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
                  <Text style={[styles.dateText, { color: colors.mutedText }]}>
                    {formatDate(request.createdAt)}
                  </Text>
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

                  <View style={styles.requestDetailsRow}>
                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="restaurant"
                        size={16}
                        color={colors.mutedText}
                      />
                      <Text style={[styles.detailText, { color: colors.mutedText }]}>
                        {request.servingSize} servings
                      </Text>
                    </View>

                    {request.volunteerName && request.showVolunteerName && (
                      <View style={styles.detailItem}>
                        <MaterialIcons
                          name="person"
                          size={16}
                          color={colors.mutedText}
                        />
                        <Text style={[styles.detailText, { color: colors.mutedText }]}>
                          {request.volunteerName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.requestFooter}>
                  <Text style={[styles.viewDetailsText, { color: '#F97316' }]}>
                    View details
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color="#F97316" />
                </View>
              </Pressable>
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
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
  dateText: {
    fontSize: 13,
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
  requestDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
