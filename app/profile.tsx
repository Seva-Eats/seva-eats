import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { LocationPicker } from '@/components/location-picker';
import { QuickActionCard } from '@/components/quick-action-card';
import { AUTH_PROVIDER_LABELS, AUTH_STORAGE_FLAG_KEY } from '@/constants/auth';
import { ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { Radii, Spacing } from '@/constants/theme';
import { useLocation, useUser } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

const MAX_NAME_LENGTH = 60;
const MAX_PHONE_DIGITS = 10;

const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/[^\d]/g, '').slice(0, MAX_PHONE_DIGITS);
  if (digitsOnly.length === 0) return '';
  if (digitsOnly.length <= 3) return `(${digitsOnly}`;
  if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  }
  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, clearProfile, signOut } = useUser();
  const { userLocation } = useLocation();
  const colors = useThemeColors();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.homeAddress?.address ?? '');
  const [addressLat, setAddressLat] = useState(user?.homeAddress?.latitude ?? 43.7315);
  const [addressLon, setAddressLon] = useState(user?.homeAddress?.longitude ?? -79.7624);
  const [servingSize, setServingSize] = useState(user?.servingSize?.toString() ?? '1');
  const [isSaving, setIsSaving] = useState(false);
  const servingSizeValue = Math.min(3, Math.max(1, parseInt(servingSize, 10) || 1));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }
    const phoneDigitsOnly = phone.replace(/[^\d]/g, '');
    if (phoneDigitsOnly.length !== MAX_PHONE_DIGITS) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        homeAddress: address.trim()
          ? {
              address: address.trim(),
              latitude: addressLat,
              longitude: addressLon,
            }
          : user?.homeAddress ?? null,
        servingSize: servingSizeValue,
      });
      Alert.alert('Saved', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset your profile and all request history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await clearProfile();
            router.back();
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'You will need to continue with account setup again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
          await AsyncStorage.multiSet([
            [AUTH_STORAGE_FLAG_KEY, 'false'],
            [ONBOARDING_STORAGE_KEY, 'true'],
          ]);
          router.replace('/(onboarding)/slide4' as any);
        },
      },
    ]);
  };

  const authProviderLabel = user?.authProvider
    ? AUTH_PROVIDER_LABELS[user.authProvider]
    : 'Not signed in';
  const displayName = user?.name?.trim() || 'Community Member';
  const displayEmail = user?.email?.trim() || 'No email on file';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const statusLabel = user?.isAuthenticated ? 'Signed in' : 'Signed out';
  const accountHint = user?.isAuthenticated
    ? 'Signed in through onboarding. Sign out to switch accounts.'
    : 'Finish account setup to unlock delivery updates and account history.';
  const providerKey = user?.authProvider ?? null;
  const providerIcon = (() => {
    if (providerKey === 'google') {
      return <FontAwesome name="google" size={16} color="#FFFFFF" />;
    }
    if (providerKey === 'apple') {
      return <MaterialCommunityIcons name="apple" size={17} color="#FFFFFF" />;
    }
    if (providerKey === 'email') {
      return <MaterialIcons name="email" size={17} color="#FFFFFF" />;
    }
    if (providerKey === 'guest') {
      return <MaterialIcons name="person-outline" size={17} color="#FFFFFF" />;
    }
    return null;
  })();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]} selectable>
              Account
            </Text>
            <View
              style={[
                styles.accountCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.accountHeader}>
                {user?.avatarUrl ? (
                  <View style={[styles.avatarShell, { borderColor: colors.accent }]}>
                    <Image
                      source={{ uri: user.avatarUrl }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.accent }]}>
                    <Text style={styles.avatarInitial} selectable>
                      {avatarInitial}
                    </Text>
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.text }]} selectable>
                    {displayName}
                  </Text>
                  <Text
                    style={[styles.accountEmail, { color: colors.mutedText }]}
                    numberOfLines={1}
                    selectable
                  >
                    {displayEmail}
                  </Text>
                </View>
              </View>

              <View style={styles.accountMetaRow}>
                <View
                  style={[
                    styles.accountMetaItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.accountMetaLabel, { color: colors.mutedText }]} selectable>
                    Status
                  </Text>
                  <Text style={[styles.accountMetaValue, { color: colors.text }]} selectable>
                    {statusLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.accountMetaItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.accountMetaContent}>
                    <View style={styles.accountMetaText}>
                      <Text style={[styles.accountMetaLabel, { color: colors.mutedText }]} selectable>
                        Provider
                      </Text>
                      <Text style={[styles.accountMetaValue, { color: colors.text }]} selectable>
                        {authProviderLabel}
                      </Text>
                    </View>
                    {providerIcon ? (
                      <View
                        style={[
                          styles.providerIconChip,
                          { backgroundColor: colors.accent, borderColor: colors.accent },
                        ]}
                      >
                        {providerIcon}
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <Text style={[styles.accountHint, { color: colors.mutedText }]} selectable>
                {accountHint}
              </Text>

              {user?.isAuthenticated ? (
                <Pressable style={styles.accountSignOutButton} onPress={handleSignOut}>
                  <MaterialIcons name="logout" size={18} color="#DC2626" />
                  <Text style={styles.accountSignOutText}>Sign Out</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.accountPrimaryButton, { backgroundColor: colors.accent }]}
                  onPress={() => router.push('/(onboarding)/slide4' as any)}
                >
                  <Text style={styles.accountPrimaryButtonText}>Continue Account Setup</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Personal Information */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={name}
                onChangeText={(value) => setName(value.slice(0, MAX_NAME_LENGTH))}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedText}
                maxLength={MAX_NAME_LENGTH}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Phone Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={phone}
                onChangeText={(value) => setPhone(formatPhoneNumber(value))}
                placeholder="(647) 555-1234"
                placeholderTextColor={colors.mutedText}
                keyboardType="phone-pad"
                maxLength={14}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Serving Size</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={servingSize}
                onChangeText={(value) => setServingSize(value.replace(/[^\d]/g, '').slice(0, 1))}
                placeholder="1"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                maxLength={1}
              />
              <Text style={[styles.fieldHint, { color: colors.mutedText }]}>Number of people (1-3)</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                icon="assignment"
                label="Active requests"
                onPress={() => router.push('/requests/active' as any)}
                testID="quick-action-active-requests"
              />
              <QuickActionCard
                icon="history"
                label="Request history"
                onPress={() => router.push('/requests/history' as any)}
                testID="quick-action-request-history"
              />
              <QuickActionCard
                icon="place"
                label="Nearby locations"
                onPress={() => router.push('/locations' as any)}
                testID="quick-action-nearby-locations"
              />
              <QuickActionCard
                icon="help-outline"
                label="Help & support"
                onPress={() => router.push('/support' as any)}
                testID="quick-action-help-support"
              />
            </View>
          </Animated.View>

          {/* Home Address */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Home Address</Text>
            <LocationPicker
              address={address}
              onAddressChange={setAddress}
              onLocationChange={(lat, lon) => {
                setAddressLat(lat);
                setAddressLon(lon);
              }}
              initialLatitude={addressLat}
              initialLongitude={addressLon}
              currentAddress={userLocation?.address}
              currentLat={userLocation?.latitude}
              currentLon={userLocation?.longitude}
              enableMapSelection
            />
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <AnimatedPressable
              style={[styles.saveButton, { backgroundColor: colors.accent }, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              hapticFeedback
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </AnimatedPressable>

            <AnimatedPressable 
              style={styles.dangerButton} 
              onPress={handleClearData}
              hapticFeedback
              hapticStyle={Haptics.ImpactFeedbackStyle.Heavy}
            >
              <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
              <Text style={styles.dangerButtonText}>Clear All Data</Text>
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  accountCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    borderCurve: 'continuous',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarShell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderCurve: 'continuous',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
    gap: 4,
  },
  accountName: {
    fontSize: 20,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  accountMetaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  accountMetaItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 4,
    minHeight: 60,
    justifyContent: 'center',
  },
  accountMetaLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  accountMetaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  accountMetaText: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  providerIconChip: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  accountMetaValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  accountHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  accountPrimaryButton: {
    borderRadius: Radii.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  accountPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  accountSignOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  accountSignOutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  saveButton: {
    borderRadius: Radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  dangerButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
});
