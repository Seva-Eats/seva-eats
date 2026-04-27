import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AUTH_STORAGE_FLAG_KEY } from '@/constants/auth';
import { ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { Radii, Spacing } from '@/constants/theme';
import { useUser } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

function SettingRow({
  icon,
  label,
  value,
  onPress,
  colors,
  testID,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
  testID?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.1)' : '#FFFBEB' }]}>
        <MaterialIcons
          name={icon as keyof typeof MaterialIcons.glyphMap}
          size={20}
          color="rgb(249, 115, 22)"
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {value && <Text style={[styles.settingValue, { color: colors.mutedText }]}>{value}</Text>}
      </View>
      {onPress && <MaterialIcons name="chevron-right" size={24} color={colors.mutedText} />}
    </Pressable>
  );
}

function ToggleSetting({
  icon,
  label,
  value,
  onValueChange,
  colors,
}: {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.1)' : '#FFFBEB' }]}>
        <MaterialIcons
          name={icon as keyof typeof MaterialIcons.glyphMap}
          size={20}
          color="rgb(249, 115, 22)"
        />
      </View>
      <View style={[styles.settingContent, styles.toggleContent]}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: 'rgba(249, 115, 22, 0.5)' }}
        thumbColor={value ? 'rgb(249, 115, 22)' : colors.mutedText}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useUser();
  const colors = useThemeColors();
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);

  const handleProfileEdit = () => {
    router.push('/profile');
  };

  const handleNotificationsChange = async (value: boolean) => {
    setNotificationsEnabled(value);
    // TODO: Save notification preference to backend/local storage
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'You will need to continue with account setup again.', [
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
          router.replace('/(onboarding)/slide4' as any);
        },
      },
    ]);
  };

  const handleHelpPress = () => {
    router.push('/support');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
          <Pressable
            style={({ pressed }) => [
              styles.profileCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleProfileEdit}
          >
            <View style={styles.profileHeader}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={[styles.profileAvatar, { borderColor: colors.accent }]} contentFit="cover" />
              ) : (
                <View style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.accent }]}>
                  <MaterialIcons name="person" size={32} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Community Member'}</Text>
                <Text style={[styles.profileEmail, { color: colors.mutedText }]}>{user?.email || 'Not signed in'}</Text>
              </View>
            </View>
            <MaterialIcons name="edit" size={20} color={colors.accent} />
          </Pressable>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <ToggleSetting
            icon="notifications-active"
            label="Enable Notifications"
            value={notificationsEnabled}
            onValueChange={handleNotificationsChange}
            colors={colors}
          />
          <View style={styles.sectionSpacer} />
          <SettingRow
            icon="language"
            label="Language"
            value="English"
            colors={colors}
            testID="setting-language"
          />
          <View style={styles.sectionSpacer} />
          <SettingRow
            icon="palette"
            label="Theme"
            value={colors.isDark ? 'Dark' : 'Light'}
            colors={colors}
            testID="setting-theme"
          />
        </View>

        {/* Account Section */}
        {user?.isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            <SettingRow
              icon="verified"
              label="Auth Provider"
              value={user.authProvider?.toUpperCase() || 'Unknown'}
              colors={colors}
              testID="setting-auth-provider"
            />
            <View style={styles.sectionSpacer} />
            <SettingRow
              icon="phone"
              label="Phone"
              value={user.phone || 'Not set'}
              colors={colors}
              testID="setting-phone"
            />
            <View style={styles.sectionSpacer} />
            <SettingRow
              icon="home"
              label="Home Address"
              value={user.homeAddress ? 'Set' : 'Not set'}
              colors={colors}
              testID="setting-address"
            />
          </View>
        )}

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Help & Support</Text>
          <SettingRow
            icon="help-outline"
            label="Help & Support"
            onPress={handleHelpPress}
            colors={colors}
            testID="setting-help"
          />
          <View style={styles.sectionSpacer} />
          <SettingRow
            icon="info"
            label="About Seva Eats"
            onPress={() => {
              Alert.alert(
                'About Seva Eats',
                'Seva Eats brings the 500-year-old tradition of Langar (free community kitchen) to your doorstep. No payment, no paperwork—just food shared with dignity.\n\nVersion 1.0.0'
              );
            }}
            colors={colors}
            testID="setting-about"
          />
        </View>

        {/* Sign Out Section */}
        {user?.isAuthenticated && (
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.signOutButtonPressed,
              ]}
              onPress={handleSignOut}
              testID="button-sign-out"
            >
              <MaterialIcons name="logout" size={20} color="#DC2626" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </Pressable>
          </View>
        )}

        {/* Version Info */}
        <View style={styles.footerSection}>
          <Text style={[styles.footerText, { color: colors.mutedText }]}>Seva Eats v1.0.0</Text>
        </View>
      </ScrollView>
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
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  profileAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  toggleContent: {
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 13,
  },
  sectionSpacer: {
    marginBottom: -Spacing.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: Radii.lg,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 12,
  },
});
