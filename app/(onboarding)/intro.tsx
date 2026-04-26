import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ONBOARDING_KEY = 'onboarding-completed';
const BG = '#FAF3EB';
const ORANGE = '#F07B2A';

export default function WelcomeScreen() {
  const router = useRouter();

  const logIn = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.appName}>Seva Eats</Text>
          <Text style={styles.tagline}>
            <Text style={styles.tagWord}>Food</Text>
            <Text style={styles.dot}>  ·  </Text>
            <Text style={styles.tagWord}>Community</Text>
            <Text style={styles.dot}>  ·  </Text>
            <Text style={styles.tagWord}>Service</Text>
          </Text>
          <Text style={styles.subtitle}>
            Connecting you with free, nutritious meals{'\n'}delivered with dignity.
          </Text>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
            onPress={() => router.push('/(onboarding)/slide1')}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </Pressable>

          <Pressable onPress={logIn} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginAction}>Log In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 32,
  },
  top: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 4,
  },
  logo: {
    width: 72,
    height: 72,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
    marginTop: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
  },
  tagWord: {
    color: ORANGE,
    fontWeight: '600',
  },
  dot: {
    color: '#C4B5A5',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  bottom: {
    gap: 16,
  },
  ctaBtn: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginAction: {
    color: ORANGE,
    fontWeight: '700',
  },
});
