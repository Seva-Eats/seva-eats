import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    id: 'what-is-seva-eats',
    question: 'What is Seva Eats?',
    answer:
      'Seva Eats connects volunteers with communities in need by coordinating free langar meal deliveries from distribution hubs to shelters, food banks, and families. It\'s powered by the spirit of seva (selfless service).',
  },
  {
    id: 'how-to-request',
    question: 'How do I request a meal delivery?',
    answer:
      'Tap "Request a shelter drop-off" on the home screen, select a pickup location and your drop-off destination, choose the number of servings, and submit your request. A volunteer will be matched to fulfill your request.',
  },
  {
    id: 'delivery-time',
    question: 'How long does delivery take?',
    answer:
      'Most deliveries are completed within 30-60 minutes of matching with a volunteer. You\'ll receive real-time updates on your delivery status through the app.',
  },
  {
    id: 'volunteer-questions',
    question: 'Can I become a volunteer driver?',
    answer:
      'Yes! We\'re always looking for dedicated volunteers. You can sign up to become a volunteer driver (Sevadar) through the app. You\'ll need a valid driver\'s license and reliable transportation.',
  },
  {
    id: 'dietary-restrictions',
    question: 'Can I specify dietary restrictions?',
    answer:
      'Yes, when creating a request you can add notes about dietary restrictions or preferences in the driver note field. All langar meals are vegetarian.',
  },
  {
    id: 'cancel-request',
    question: 'How do I cancel a request?',
    answer:
      'You can cancel a pending request by going to your active request details and tapping the "Cancel Request" button. Please cancel as early as possible if your plans change.',
  },
  {
    id: 'track-delivery',
    question: 'Can I track my delivery?',
    answer:
      'Yes! Once a volunteer accepts your request, you can track their location in real-time from the request details screen. You\'ll see when they pick up the meals and when they\'re on their way to you.',
  },
  {
    id: 'cost',
    question: 'Is there a cost for this service?',
    answer:
      'No, Seva Eats is completely free. All meals are provided through the generosity of our gurdwara partners and delivered by volunteers. This is seva - selfless service to the community.',
  },
];

// Contact support cards removed to avoid unsupported `mailto:`/`tel:` links on some platforms.

export default function SupportScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Help & Support',
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
            Help & Support
          </Text>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={24} color={colors.text} />
          </Pressable>
        </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        {/* Contact Support Section intentionally removed */}

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently asked questions
          </Text>
          <View style={styles.faqList}>
            {faqs.map((faq) => {
              const isExpanded = expandedFAQ === faq.id;
              return (
                <Pressable
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    {
                      backgroundColor: colors.isDark ? colors.surface : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>
                      {faq.question}
                    </Text>
                    <MaterialIcons
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={colors.mutedText}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={[styles.faqAnswer, { color: colors.mutedText }]}>
                      {faq.answer}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Resources
          </Text>
          <View style={styles.resourcesList}>
            <Pressable
              style={({ pressed }) => [
                styles.resourceCard,
                {
                  backgroundColor: colors.isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() =>
                Alert.alert('Coming Soon', 'User guide coming soon!', [
                  { text: 'OK' },
                ])
              }
            >
              <MaterialIcons name="menu-book" size={20} color="#F97316" />
              <Text style={[styles.resourceText, { color: colors.text }]}>
                User Guide
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.mutedText}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resourceCard,
                {
                  backgroundColor: colors.isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() =>
                Alert.alert('Coming Soon', 'Privacy policy coming soon!', [
                  { text: 'OK' },
                ])
              }
            >
              <MaterialIcons name="privacy-tip" size={20} color="#F97316" />
              <Text style={[styles.resourceText, { color: colors.text }]}>
                Privacy Policy
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.mutedText}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resourceCard,
                {
                  backgroundColor: colors.isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() =>
                Alert.alert('Coming Soon', 'Terms of service coming soon!', [
                  { text: 'OK' },
                ])
              }
            >
              <MaterialIcons name="description" size={20} color="#F97316" />
              <Text style={[styles.resourceText, { color: colors.text }]}>
                Terms of Service
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.mutedText}
              />
            </Pressable>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.mutedText }]}>
            Seva Eats v1.0.0
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.mutedText }]}>
            Made with love for the community
          </Text>
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },

  // Support Options
  supportOptions: {
    gap: Spacing.md,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportContent: {
    flex: 1,
  },
  supportLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 14,
    letterSpacing: -0.2,
  },

  // FAQ
  faqList: {
    gap: Spacing.md,
  },
  faqCard: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.2,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Resources
  resourcesList: {
    gap: Spacing.sm,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  versionText: {
    fontSize: 13,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
