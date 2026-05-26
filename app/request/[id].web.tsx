import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing } from '@/constants/theme';
import { useRequests } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function RequestTrackingWebScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colors = useThemeColors();
  const { getRequest } = useRequests();

  const request = typeof id === 'string' ? getRequest(id) : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Request Tracking</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Request ID</Text>
          <Text style={[styles.value, { color: colors.text }]}>{request?.id ?? id ?? 'Unknown'}</Text>

          <Text style={[styles.label, { color: colors.mutedText }]}>Status</Text>
          <Text style={[styles.value, { color: colors.text }]}>{request?.status ?? 'Pending'}</Text>

          <Text style={[styles.note, { color: colors.mutedText }]}>
            Live map tracking is available in the iOS/Android app.
          </Text>
        </View>
      </View>
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
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  note: {
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 20,
  },
});
