import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pickupLocations, type PickupLocation } from '@/constants/mock-data';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

function LocationCard({
  location,
  selected,
  onPress,
  index,
  colors,
  shadows,
}: {
  location: PickupLocation;
  selected: boolean;
  onPress: () => void;
  index: number;
  colors: ReturnType<typeof useThemeColors>;
  shadows: typeof Shadows.light;
}) {
  const getIcon = () => 'location-on';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.locationCardWrapper}
    >
      <Pressable
        style={[
          styles.locationCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
          selected && {
            borderColor: colors.accent,
            backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFFBEB',
          },
          shadows.card,
        ]}
        onPress={onPress}
      >
          <View style={[styles.iconCircle, { backgroundColor: selected ? colors.accent : colors.isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFF7ED' }]}>
          <MaterialIcons
            name={getIcon() as any}
            size={28}
            color={selected ? '#FFF8F0' : colors.accent}
          />
        </View>

        <View style={styles.locationInfo}>
          <Text style={[styles.locationName, { color: colors.text }]}>{location.name}</Text>
          <Text style={[styles.locationAddress, { color: colors.mutedText }]}>{location.address}</Text>
          <Text style={[styles.locationDistance, { color: colors.accent }]}>{location.distance} away</Text>
          <Text style={[styles.locationPartner, { color: colors.mutedText }]}>Next delivery: {location.nextPickupWindow}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.mutedText }]}>Meals available today: {location.boxesAvailable}</Text>
            <View style={[styles.metaBadge, { backgroundColor: colors.isDark ? 'rgba(34, 197, 94, 0.2)' : '#ECFDF5' }]}> 
              <Text style={[styles.metaBadgeText, { color: colors.isDark ? '#34D399' : '#059669' }]}>Available</Text>
            </View>
          </View>
        </View>

        {selected && (
          <View style={[styles.selectedBadge, { backgroundColor: colors.accent }]}>
            <MaterialIcons name="check" size={16} color="#FFF8F0" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function LocationSelectionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const shadows = colors.isDark ? Shadows.dark : Shadows.light;
  const [selectedLocation, setSelectedLocation] = useState<PickupLocation | null>(null);

  const handleSelectLocation = (location: PickupLocation) => {
    setSelectedLocation(location);
  };

  const handleContinue = () => {
    if (selectedLocation) {
      router.push(`/request/new?location=${selectedLocation.id}` as any);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Choose Pickup Hub</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>Select a nearby gurdwara hub</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
          <MaterialIcons name="account-circle" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <Animated.View entering={FadeIn.delay(100)} style={[styles.infoBanner, { backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED' }]}>
          <MaterialIcons name="storefront" size={24} color={colors.accent} />
          <View style={styles.infoBannerText}>
            <Text style={[styles.infoBannerTitle, { color: colors.isDark ? colors.accent : '#92400E' }]}>Pick up at a Seva hub</Text>
            <Text style={[styles.infoBannerDesc, { color: colors.isDark ? colors.mutedText : '#B45309' }]}>
              Choose the hub with the best delivery window before selecting meals
            </Text>
          </View>
        </Animated.View>

        {/* Locations List */}
        <View style={styles.locationsList}>
          {pickupLocations.map((location, index) => (
            <LocationCard
              key={location.id}
              location={location}
              selected={selectedLocation?.id === location.id}
              onPress={() => handleSelectLocation(location)}
              index={index}
              colors={colors}
              shadows={shadows}
            />
          ))}
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {selectedLocation && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }, shadows.floating]}
        >
          <View style={styles.bottomBarContent}>
            <View style={styles.locationSummary}>
              <View style={[styles.locationBadge, { backgroundColor: colors.accent }]}>
                  <MaterialIcons name="location-on" size={16} color="#FFF8F0" />
                </View>
              <View>
              <Text style={[styles.locationLabel, { color: colors.text }]}>{selectedLocation.name}</Text>
              <Text style={[styles.locationSubLabel, { color: colors.mutedText }]}>Pickup hub selected</Text>
              </View>
            </View>
              <Pressable style={[styles.continueButton, { backgroundColor: colors.accent }]} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF8F0" />
            </Pressable>
          </View>
        </Animated.View>
      )}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  infoBanner: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoBannerDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  locationsList: {
    gap: Spacing.md,
  },
  locationCardWrapper: {
    width: '100%',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    marginBottom: 2,
  },
  locationDistance: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationPartner: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  locationBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationSubLabel: {
    fontSize: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF8F0',
  },
});
