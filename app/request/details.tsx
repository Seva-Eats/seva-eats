import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationPicker } from '@/components/location-picker';
import { getMealById } from '@/constants/meals';
import { pickupLocations } from '@/constants/mock-data';
import { Radii, Spacing } from '@/constants/theme';
import { useLocation, useRequests, useUser } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

const SERVING_SIZES = [1, 2, 3];
const DELIVERY_WINDOWS = ['12–2 PM', '2–4 PM', '6–8 PM'];
const MAX_NOTE_LENGTH = 200;

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/[^\d]/g, '');
  
  // Limit to 10 digits
  const limited = digitsOnly.slice(0, 10);
  
  // Format: (XXX) XXX-XXXX
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

export default function DeliveryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meals: string; location: string }>();
  const { userLocation } = useLocation();
  const { user } = useUser();
  const { submitRequest, activeRequest } = useRequests();
  const colors = useThemeColors();

  // Parse selected meals from URL params
  const selectedMeals = useMemo(() => {
    if (!params.meals) return [];
    return params.meals.split(',').map((item) => {
      const [id, qty] = item.split(':');
      const meal = getMealById(id);
      return meal ? { meal, quantity: parseInt(qty, 10) } : null;
    }).filter(Boolean) as { meal: NonNullable<ReturnType<typeof getMealById>>; quantity: number }[];
  }, [params.meals]);

  // Find selected location
  const selectedLocation = useMemo(() => {
    if (!params.location) return null;
    return pickupLocations.find((loc) => loc.id === params.location) || null;
  }, [params.location]);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.homeAddress?.address ?? selectedLocation?.location.address ?? '');
  const [selectedLat, setSelectedLat] = useState(user?.homeAddress?.latitude ?? selectedLocation?.location.latitude ?? userLocation?.latitude ?? 43.7315);
  const [selectedLon, setSelectedLon] = useState(user?.homeAddress?.longitude ?? selectedLocation?.location.longitude ?? userLocation?.longitude ?? -79.7624);
  const [servingSize, setServingSize] = useState(user?.servingSize ?? 2);
  const [thankYouNote, setThankYouNote] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState<'leave_at_door' | 'hand_to_me'>('leave_at_door');
  const [deliveryWindow, setDeliveryWindow] = useState(DELIVERY_WINDOWS[0]);
  const [donationAmount, setDonationAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const thankYouNoteCount = thankYouNote.length;

  const handleSubmit = () => {
    // Validate
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number so the driver can contact if there are any issues.');
      return;
    }
    // Validate phone format - should have 10 digits
    const phoneDigitsOnly = phone.replace(/[^\d]/g, '');
    if (phoneDigitsOnly.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address.');
      return;
    }

    // Check for existing active request
    if (activeRequest) {
      Alert.alert(
        'Request in Progress',
        'You already have an active meal request. Please wait for it to be completed.',
        [
          { text: 'View Request', onPress: () => router.push(`/request/${activeRequest.id}` as any) },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    setIsSubmitting(true);

    // Create meal description from selections
    const mealDescription = selectedMeals
      .map((item) => `${item.quantity}x ${item.meal.name}`)
      .join(', ');

    const request = submitRequest({
      recipientName: name.trim(),
      recipientPhone: phone.trim(),
      deliveryAddress: {
        address: address.trim(),
        latitude: selectedLat,
        longitude: selectedLon,
      },
      servingSize,
      dietaryRestrictions: [],
      pickupLocation: selectedLocation ? {
        address: selectedLocation.address,
        latitude: selectedLocation.location.latitude,
        longitude: selectedLocation.location.longitude,
      } : undefined,
      pickupLocationId: selectedLocation?.id,
      pickupLocationName: selectedLocation?.name,
      driverNote: [
        `Meals: ${mealDescription}`,
        `Delivery: ${deliveryPreference === 'leave_at_door' ? 'Leave at door' : 'Hand to me'}`,
        `Window: ${deliveryWindow}`,
        selectedLocation ? `Pickup: ${selectedLocation.name}` : null,
        thankYouNote.trim() ? `Thank you: ${thankYouNote.trim()}` : null,
        donationAmount.trim() ? `Donation: $${donationAmount.trim()}` : null,
      ].filter(Boolean).join('\n'),
    });

    setIsSubmitting(false);
    router.replace(`/request/${request.id}` as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Delivery Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected Meals Summary */}
          <Animated.View entering={FadeIn.delay(100)} style={[styles.mealsSummary, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Your Order</Text>
            {selectedMeals.map((item) => (
              <View key={item.meal.id} style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: item.meal.backgroundColor }]}>
                  <MaterialIcons
                    name={item.meal.icon as any}
                    size={16}
                    color={item.meal.iconColor}
                  />
                </View>
                <Text style={[styles.summaryMealName, { color: colors.text }]}>{item.meal.name}</Text>
                <Text style={[styles.summaryQuantity, { color: colors.accent }]}>x{item.quantity}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInDown.delay(150)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor={colors.mutedText}
            />
          </Animated.View>

           {/* Phone Input */}
           <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
             <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
             <TextInput
               style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
               placeholder="(XXX) XXX-XXXX"
               value={phone}
               onChangeText={(value) => setPhone(formatPhoneNumber(value))}
               keyboardType="phone-pad"
               placeholderTextColor={colors.mutedText}
               maxLength={14}
             />
             <Text style={[styles.helper, { color: colors.mutedText }]}>So the driver can contact if there are any issues</Text>
           </Animated.View>

           {/* Delivery Location */}
           <Animated.View entering={FadeInDown.delay(250)} style={styles.inputGroup}>
             <Text style={[styles.label, { color: colors.text }]}>Delivery location</Text>
             {selectedLocation ? (
               <View style={[styles.selectedLocationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 <View style={[styles.locationIcon, { backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFF7ED' }]}>
                   <MaterialIcons name="location-on" size={20} color={colors.accent} />
                 </View>
                 <View style={styles.locationDetails}>
                   <Text style={[styles.locationName, { color: colors.text }]}>{selectedLocation.name}</Text>
                   <Text style={[styles.locationAddress, { color: colors.mutedText }]}>{selectedLocation.address}</Text>
                   <Text style={[styles.locationPartner, { color: colors.accent }]}>{selectedLocation.nextPickupWindow}</Text>
                 </View>
               </View>
             ) : (
               <LocationPicker
                 address={address}
                 onAddressChange={setAddress}
                 onLocationChange={(lat, lon) => {
                   setSelectedLat(lat);
                   setSelectedLon(lon);
                 }}
                 initialLatitude={selectedLat}
                 initialLongitude={selectedLon}
                 currentAddress={userLocation?.address}
                 currentLat={userLocation?.latitude}
                 currentLon={userLocation?.longitude}
                 placeholder="Enter a nearby shelter or partner address"
               />
             )}
             <Text style={[styles.helper, { color: colors.mutedText }]}>
               {selectedLocation
                 ? 'Meals are prepared at this hub for partner drop-offs.'
                 : 'Beta: deliveries go to partner shelters and community drop-offs.'
               }
             </Text>
           </Animated.View>

          {/* Serving Size */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Serving Size</Text>
            <Text style={[styles.helper, { color: colors.mutedText }]}>How many servings should we prepare?</Text>
            <View style={styles.familySizeRow}>
              {SERVING_SIZES.map((size) => (
                <Pressable
                  key={size}
                  style={[
                    styles.familySizeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    servingSize === size && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => setServingSize(size)}
                >
                  <Text
                    style={[
                      styles.familySizeText,
                      { color: colors.text },
                      servingSize === size && { color: '#FFF8F0' },
                    ]}
                  >
                    {size}{size === 8 ? '+' : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Delivery Window */}
          <Animated.View entering={FadeInDown.delay(350)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Delivery window</Text>
            <View style={styles.deliveryOptions}>
              {DELIVERY_WINDOWS.map((window) => (
                <Pressable
                  key={window}
                  style={[
                    styles.deliveryOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    deliveryWindow === window && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => setDeliveryWindow(window)}
                >
                  <Text
                    style={[
                      styles.deliveryOptionText,
                      { color: colors.text },
                      deliveryWindow === window && { color: '#FFF8F0' },
                    ]}
                  >
                    {window}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Delivery Preference */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Delivery preference</Text>
            <View style={styles.deliveryOptions}>
              <Pressable
                style={[
                  styles.deliveryOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  deliveryPreference === 'leave_at_door' && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => setDeliveryPreference('leave_at_door')}
              >
                <MaterialIcons name="door-front" size={18} color={deliveryPreference === 'leave_at_door' ? '#FFF8F0' : colors.text} />
                <Text style={[styles.deliveryOptionText, { color: colors.text }, deliveryPreference === 'leave_at_door' && { color: '#FFF8F0' }]}>
                  Leave at door
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.deliveryOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  deliveryPreference === 'hand_to_me' && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => setDeliveryPreference('hand_to_me')}
              >
                <MaterialIcons name="person" size={18} color={deliveryPreference === 'hand_to_me' ? '#FFF8F0' : colors.text} />
                <Text style={[styles.deliveryOptionText, { color: colors.text }, deliveryPreference === 'hand_to_me' && { color: '#FFF8F0' }]}>
                  Hand to me
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.helper, { color: colors.mutedText }]}>We can’t promise restaurant-heat, but every meal is made with love.</Text>
          </Animated.View>

          {/* Thank You Note */}
          <Animated.View entering={FadeInDown.delay(450)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Give a message to your driver ❤️</Text>
            <Text style={[styles.helper, { color: colors.mutedText }]}>Optional message that stays private</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Write a short thank-you"
              value={thankYouNote}
              onChangeText={(text) => setThankYouNote(text.slice(0, MAX_NOTE_LENGTH))}
              multiline
              numberOfLines={3}
              maxLength={MAX_NOTE_LENGTH}
              placeholderTextColor={colors.mutedText}
            />
            <View style={styles.noteFooter}>
              <Text style={[styles.noteHint, { color: colors.mutedText }]}>Be respectful. Notes are visible to drivers.</Text>
              <Text style={[styles.noteCount, { color: colors.mutedText }]}>{thankYouNoteCount}/{MAX_NOTE_LENGTH}</Text>
            </View>
          </Animated.View>

          {/* Donation */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Donate (optional)</Text>
            <Text style={[styles.helper, { color: colors.mutedText }]}>Help support packaging and delivery costs</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="$5"
              value={donationAmount}
              onChangeText={(value) => {
                const digitsOnly = value.replace(/[^0-9]/g, '');
                setDonationAmount(digitsOnly.slice(0, 3));
              }}
              keyboardType="numeric"
              placeholderTextColor={colors.mutedText}
            />
          </Animated.View>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.accent }, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <MaterialIcons name="restaurant" size={20} color="#FFF8F0" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Request Drop-off'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  mealsSummary: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMealName: {
    flex: 1,
    fontSize: 14,
  },
  summaryQuantity: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  helper: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteFooter: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteHint: {
    fontSize: 11,
  },
  noteCount: {
    fontSize: 11,
  },
  addressInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  useCurrentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  useCurrentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  familySizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  familySizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  familySizeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  deliveryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  deliveryOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationPartner: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF8F0',
  },
});
