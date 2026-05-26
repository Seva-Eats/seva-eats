import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type LocationPickerProps = {
  address: string;
  onAddressChange: (address: string) => void;
  onLocationChange?: (lat: number, lon: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  placeholder?: string;
  currentAddress?: string;
  currentLat?: number;
  currentLon?: number;
  enableMapSelection?: boolean;
};

export function LocationPicker({
  address,
  onAddressChange,
  onLocationChange,
  initialLatitude = 43.7315,
  initialLongitude = -79.7624,
  placeholder = 'Enter a shelter or partner address',
  currentAddress,
  currentLat,
  currentLon,
  enableMapSelection = false,
}: LocationPickerProps) {
  const colors = useThemeColors();

  const handleQuickAddLocation = () => {
    if (!currentAddress) return;
    onAddressChange(currentAddress);
    onLocationChange?.(currentLat ?? initialLatitude, currentLon ?? initialLongitude);
  };

  return (
    <View>
      <View style={[styles.addressInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <MaterialIcons name="location-on" size={20} color={colors.accent} />
        <TextInput
          style={[styles.addressInput, { color: colors.text }]}
          placeholder={placeholder}
          value={address}
          onChangeText={onAddressChange}
          multiline
          placeholderTextColor={colors.mutedText}
        />
      </View>

      {currentAddress && (
        <Pressable
          style={[
            styles.quickAddButton,
            {
              backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.1)' : '#FFF7ED',
              borderColor: colors.accent,
            },
          ]}
          onPress={handleQuickAddLocation}
        >
          <MaterialIcons name="my-location" size={18} color={colors.accent} />
          <Text style={[styles.quickAddText, { color: colors.accent }]}>Quick add current location</Text>
        </Pressable>
      )}

      {enableMapSelection && (
        <View style={[styles.webMapNotice, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <MaterialIcons name="map" size={18} color={colors.accent} />
          <Text style={[styles.webMapText, { color: colors.mutedText }]}>
            Map pin selection is available in the iOS/Android app.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addressInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 44,
  },
  quickAddButton: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  quickAddText: {
    fontSize: 13,
    fontWeight: '600',
  },
  webMapNotice: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  webMapText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
