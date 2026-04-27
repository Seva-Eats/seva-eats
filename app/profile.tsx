import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        homeAddress: address.trim() ? {
          address: address.trim(),
          latitude: addressLat,
          longitude: addressLon,
        } : user?.homeAddress ?? null,
        servingSize: servingSizeValue,
      });
      Alert.alert('Saved', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() }
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
            await clearProfile();
            router.back();
          }
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          await AsyncStorage.multiSet([
            [AUTH_STORAGE_FLAG_KEY, 'false'],
            [ONBOARDING_STORAGE_KEY, 'true'],
          ]);
          router.replace('/(onboarding)/slide3');
        },
      },
    ]);
  };

  const authProviderLabel = user?.authProvider
    ? AUTH_PROVIDER_LABELS[user.authProvider]
    : 'Not signed in';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
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
                style={[styles.input, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
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
                style={[styles.input, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={servingSize}
                onChangeText={(value) => setServingSize(value.replace(/[^\d]/g, '').slice(0, 1))}
                placeholder="1"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                maxLength={1}
              />
              <Text style={[styles.fieldHint, { color: colors.mutedText }]}>Number of people (1-3)</Text>
            </View>
          </View>

          <View style={styles.section}>
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
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Authentication</Text>
            <View style={[styles.authCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.authRow}>
                <Text style={[styles.authLabel, { color: colors.mutedText }]}>Status</Text>
                <Text style={[styles.authValue, { color: colors.text }]}>{user?.isAuthenticated ? 'Signed in' : 'Signed out'}</Text>
              </View>
              <View style={styles.authRow}>
                <Text style={[styles.authLabel, { color: colors.mutedText }]}>Provider</Text>
                <Text style={[styles.authValue, { color: colors.text }]}>{authProviderLabel}</Text>
              </View>
              <View style={styles.authRow}>
                <Text style={[styles.authLabel, { color: colors.mutedText }]}>Email</Text>
                <Text style={[styles.authValue, { color: colors.text }]}>{user?.email || 'Not provided'}</Text>
              </View>

              {user?.isAuthenticated ? (
                <Pressable style={styles.authButton} onPress={handleSignOut}>
                  <MaterialIcons name="logout" size={18} color="#DC2626" />
                  <Text style={styles.authButtonText}>Sign Out</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.authPrimaryButton, { backgroundColor: colors.accent }]}
                  onPress={() => router.push('/(onboarding)/slide3')}
                >
                  <Text style={styles.authPrimaryButtonText}>Sign In</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Home Address */}
          <View style={styles.section}>
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
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Pressable 
              style={[styles.saveButton, { backgroundColor: colors.accent }, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>

            <Pressable style={styles.dangerButton} onPress={handleClearData}>
              <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
              <Text style={styles.dangerButtonText}>Clear All Data</Text>
            </Pressable>
          </View>
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
  authCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  authRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  authValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  authButton: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  authButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  authPrimaryButton: {
    marginTop: Spacing.xs,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  authPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
