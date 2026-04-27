import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing } from '@/constants/theme';
import { useUser } from '@/context';
import { useThemeColors } from '@/hooks/use-theme-colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLATE_SIZE = Math.min(SCREEN_WIDTH * 0.4, 160);

function LogoMark({ size }: { size: number }) {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Seva Eats logo"
    />
  );
}

export default function IndexScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useUser();

  const handleContinue = () => {
    if (user?.isAuthenticated) {
      router.replace('/request/location');
      return;
    }
    router.push('/(onboarding)/slide1');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.headerTop}>
          <Animated.View entering={FadeIn.duration(600).delay(100)}>
            <View style={styles.logoWrap}>
              <LogoMark size={PLATE_SIZE} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Request a free langar{`\n`}meal near you</Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedText }]}>Food is shared with dignity. No payment, no paperwork.</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.actions}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.requestButton,
              { backgroundColor: colors.accent },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.requestText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    paddingBottom: Spacing.xl,
    marginTop: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  requestButton: {
    borderRadius: Radii.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  requestText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerTop: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 2,
  },
  heroText: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  heroSubtitle: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 320,
  },
});
