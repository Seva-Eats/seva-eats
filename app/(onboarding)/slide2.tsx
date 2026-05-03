import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackNavButton from '@/components/onboarding/BackNavButton';
import ProgressDots from '@/components/onboarding/ProgressDots';
import { ONBOARDING_COLORS, ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';

const ORANGE = ONBOARDING_COLORS.accent;
const CTA_BUTTON_HEIGHT = 50;
const CTA_BUTTON_RADIUS = 14;

export default function Slide2Screen() {
  const router = useRouter();

  const skip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <BackNavButton onPress={() => router.replace('/(onboarding)/slide1')} />
          <ProgressDots total={3} current={1} />
          <Pressable onPress={skip} hitSlop={12} style={styles.navBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.labelWrap}>
            <Text style={styles.label}>DID YOU KNOW</Text>
          </View>

          <Text style={styles.headline}>The Tradition{`\n`}of Langar</Text>

          <View style={styles.quoteCard}>
            <View style={styles.cardAccent} />
            <View style={styles.cardContent}>
              <Text style={styles.quoteOpen}>{'\u201C'}</Text>
              <Text style={styles.quoteText}>
                For over 500 years, Sikh gurdwaras have served langar - a free community kitchen
                open to everyone, regardless of caste, creed, religion, or background. No one
                leaves hungry.
              </Text>

              <View style={styles.quoteAttrib}>
                <View style={styles.attribLine} />
                <Text style={styles.attribText}>The Sikh tradition of Langar</Text>
              </View>
            </View>
          </View>

          <Text style={styles.outro}>We bring this 500-year-old tradition to your doorstep with care.</Text>

          <View style={styles.pillRow}>
            <Pill icon="people" label="Community" />
            <Pill icon="volunteer-activism" label="Selfless Service" />
            <Pill icon="lock-open" label="Open to all" />
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
            onPress={() => router.replace('/(onboarding)/slide3')}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Pill({ icon, label }: { icon: ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  return (
    <View style={styles.pill}>
      <MaterialIcons name={icon} size={15} color={ORANGE} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: 16,
    paddingBottom: 8,
  },
  labelWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8D4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: ORANGE,
    letterSpacing: 1.4,
  },
  headline: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 47,
    letterSpacing: -0.8,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardAccent: {
    width: 5,
    backgroundColor: ORANGE,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  quoteOpen: {
    fontSize: 46,
    color: ORANGE,
    lineHeight: 36,
    fontWeight: '900',
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4A4A4A',
    fontStyle: 'italic',
  },
  quoteAttrib: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  attribLine: {
    width: 20,
    height: 2,
    backgroundColor: ORANGE,
    borderRadius: 1,
  },
  attribText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  outro: {
    fontSize: 18,
    lineHeight: 27,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  ctaBtn: {
    marginTop: 6,
    height: CTA_BUTTON_HEIGHT,
    backgroundColor: ORANGE,
    borderRadius: CTA_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ctaText: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
