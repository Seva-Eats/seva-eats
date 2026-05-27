import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dropOffLocations, type DropOffLocation } from '@/constants/mock-data';
import { Radii, Spacing } from '@/constants/theme';
import { useLocation } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NearbyLocationsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { userLocation } = useLocation();
  const [showMap, setShowMap] = useState(false);

  const getLocationTypeIcon = (type: DropOffLocation['type']) => {
    switch (type) {
      case 'shelter':
        return 'night-shelter';
      case 'food_bank':
        return 'food-bank';
      case 'community_center':
        return 'groups';
      case 'family':
        return 'home';
      default:
        return 'place';
    }
  };

  const getLocationTypeLabel = (type: DropOffLocation['type']) => {
    switch (type) {
      case 'shelter':
        return 'Shelter';
      case 'food_bank':
        return 'Food Bank';
      case 'community_center':
        return 'Community Center';
      case 'family':
        return 'Family';
      default:
        return 'Location';
    }
  };

  const getLocationTypeColor = (type: DropOffLocation['type']) => {
    switch (type) {
      case 'shelter':
        return '#3B82F6';
      case 'food_bank':
        return '#10B981';
      case 'community_center':
        return '#8B5CF6';
      case 'family':
        return '#F97316';
      default:
        return colors.mutedText;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nearby Locations',
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
            Nearby Locations
          </Text>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Toggle View Buttons */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.toggleButton,
              !showMap && [
                styles.toggleButtonActive,
                { backgroundColor: '#F97316' },
              ],
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowMap(false)}
          >
            <MaterialIcons
              name="list"
              size={20}
              color={!showMap ? '#FFF8F0' : colors.mutedText}
            />
            <Text
              style={[
                styles.toggleText,
                { color: !showMap ? '#FFF8F0' : colors.mutedText },
              ]}
            >
              List
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.toggleButton,
              showMap && [
                styles.toggleButtonActive,
                { backgroundColor: '#F97316' },
              ],
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowMap(true)}
          >
            <MaterialIcons
              name="map"
              size={20}
              color={showMap ? '#FFF8F0' : colors.mutedText}
            />
            <Text
              style={[
                styles.toggleText,
                { color: showMap ? '#FFF8F0' : colors.mutedText },
              ]}
            >
              Map
            </Text>
          </Pressable>
        </View>

        {showMap ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: userLocation?.latitude ?? 43.7315,
              longitude: userLocation?.longitude ?? -79.7624,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {dropOffLocations.map((location) => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.location.latitude,
                  longitude: location.location.longitude,
                }}
                title={location.name}
                description={location.address}
                pinColor={getLocationTypeColor(location.type)}
              />
            ))}
          </MapView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoCard}>
              <MaterialIcons name="info-outline" size={20} color="#F97316" />
              <Text style={[styles.infoText, { color: colors.mutedText }]}>
                These are partner locations where you can request meal drop-offs
              </Text>
            </View>

            <View style={styles.locationsList}>
              {dropOffLocations.map((location, index) => (
                <Animated.View 
                  key={location.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.locationCard,
                      {
                        backgroundColor: colors.isDark ? colors.surface : '#FFF8F0',
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      // Navigate to request with pre-selected location
                      router.push('/request/location');
                    }}
                  >
                  <View
                    style={[
                      styles.locationIconContainer,
                      {
                        backgroundColor: `${getLocationTypeColor(location.type)}15`,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={getLocationTypeIcon(location.type) as any}
                      size={28}
                      color={getLocationTypeColor(location.type)}
                    />
                  </View>

                  <View style={styles.locationContent}>
                    <View style={styles.locationHeader}>
                      <Text
                        style={[styles.locationName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {location.name}
                      </Text>
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: `${getLocationTypeColor(location.type)}15`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeText,
                            { color: getLocationTypeColor(location.type) },
                          ]}
                        >
                          {getLocationTypeLabel(location.type)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.locationDetails}>
                      <View style={styles.locationDetailRow}>
                        <MaterialIcons
                          name="place"
                          size={16}
                          color={colors.mutedText}
                        />
                        <Text
                          style={[styles.locationAddress, { color: colors.mutedText }]}
                          numberOfLines={1}
                        >
                          {location.address}
                        </Text>
                      </View>

                      <View style={styles.locationMetaRow}>
                        <View style={styles.locationMeta}>
                          <MaterialIcons
                            name="near-me"
                            size={14}
                            color={colors.mutedText}
                          />
                          <Text
                            style={[styles.locationMetaText, { color: colors.mutedText }]}
                          >
                            {location.distance}
                          </Text>
                        </View>

                        <View style={styles.locationMeta}>
                          <MaterialIcons
                            name="restaurant"
                            size={14}
                            color={colors.mutedText}
                          />
                          <Text
                            style={[styles.locationMetaText, { color: colors.mutedText }]}
                          >
                            {location.boxesNeeded} boxes needed
                          </Text>
                        </View>
                      </View>

                      <View style={styles.partnerBadge}>
                        <MaterialIcons
                          name="handshake"
                          size={14}
                          color={colors.mutedText}
                        />
                        <Text
                          style={[styles.partnerText, { color: colors.mutedText }]}
                        >
                          {location.partnerProgram}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
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
  toggleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
  },
  toggleButtonActive: {
    // backgroundColor set inline
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  map: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  locationsList: {
    gap: Spacing.md,
  },
  locationCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  locationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContent: {
    flex: 1,
    gap: Spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  locationDetails: {
    gap: 6,
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationAddress: {
    fontSize: 14,
    letterSpacing: -0.2,
    flex: 1,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationMetaText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  partnerText: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
