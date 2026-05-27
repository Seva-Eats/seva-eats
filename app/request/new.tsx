import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mealOptions, type MealOption } from '@/constants/meals';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SelectedMeal = {
  meal: MealOption;
  quantity: number;
};

function MealCard({
  meal,
  selected,
  quantity,
  onPress,
  onIncrement,
  onDecrement,
  index,
  colors,
  shadows,
}: {
  meal: MealOption;
  selected: boolean;
  quantity: number;
  onPress: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  index: number;
  colors: ReturnType<typeof useThemeColors>;
  shadows: typeof Shadows.light;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.mealCardWrapper}
    >
      <AnimatedPressable
        style={[
          styles.mealCard,
          { 
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
          selected && { 
            borderColor: colors.accent,
            backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFFBEB',
          },
          shadows.card,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Icon Circle */}
        <View style={[styles.iconCircle, { backgroundColor: meal.backgroundColor }]}>
          <MaterialIcons
            name={meal.icon as keyof typeof MaterialIcons.glyphMap}
            size={32}
            color={meal.iconColor}
          />
        </View>

        {/* Meal Info */}
        <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
        <Text style={[styles.mealDescription, { color: colors.mutedText }]} numberOfLines={2}>
          {meal.description}
        </Text>
        <Text style={[styles.mealServings, { color: colors.accent }]}>{meal.servings}</Text>

        {/* Selection Badge / Quantity Controls */}
        {selected ? (
          <View style={[styles.quantityRow, { backgroundColor: colors.accent }]}>
            <Pressable
              style={styles.quantityButton}
              onPress={onDecrement}
              hitSlop={8}
            >
                <MaterialIcons
                name={quantity === 1 ? 'close' : 'remove'}
                size={16}
                color="#FFF8F0"
              />
            </Pressable>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Pressable
              style={styles.quantityButton}
              onPress={onIncrement}
              hitSlop={8}
            >
              <MaterialIcons name="add" size={16} color="#FFF8F0" />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.addBadge, { backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFF7ED', borderColor: colors.accent }]}>
            <MaterialIcons name="add" size={18} color={colors.accent} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function MealSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const shadows = colors.isDark ? Shadows.dark : Shadows.light;
  const [selectedMeals, setSelectedMeals] = useState<Map<string, SelectedMeal>>(
    new Map()
  );

  const totalMeals = Array.from(selectedMeals.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleSelectMeal = useCallback((meal: MealOption) => {
    setSelectedMeals((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(meal.id)) {
        // Already selected - increment quantity
        const existing = newMap.get(meal.id)!;
        newMap.set(meal.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        // New selection
        newMap.set(meal.id, { meal, quantity: 1 });
      }
      return newMap;
    });
  }, []);

  const handleIncrement = useCallback((mealId: string) => {
    setSelectedMeals((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(mealId);
      if (existing) {
        newMap.set(mealId, { ...existing, quantity: existing.quantity + 1 });
      }
      return newMap;
    });
  }, []);

  const handleDecrement = useCallback((mealId: string) => {
    setSelectedMeals((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(mealId);
      if (existing) {
        if (existing.quantity <= 1) {
          newMap.delete(mealId);
        } else {
          newMap.set(mealId, { ...existing, quantity: existing.quantity - 1 });
        }
      }
      return newMap;
    });
  }, []);

  const handleContinue = () => {
    // Pass selected meals and location to next screen via search params
    const mealsParam = Array.from(selectedMeals.entries())
      .map(([id, item]) => `${id}:${item.quantity}`)
      .join(',');
    const locationParam = params.location ? `&location=${params.location}` : '';
    router.push(`/request/details?meals=${mealsParam}${locationParam}` as any);
  };

  const mainMeals = mealOptions.filter((m) => m.category === 'main');
  const desserts = mealOptions.filter((m) => m.category === 'dessert');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/request/location'))} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Choose Your Meals</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>All meals are 100% free</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
          <MaterialIcons name="account-circle" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <Animated.View entering={FadeIn.delay(100)} style={[styles.infoBanner, { backgroundColor: colors.isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED' }]}>
          <MaterialIcons name="delivery-dining" size={24} color={colors.accent} />
          <View style={styles.infoBannerText}>
            <Text style={[styles.infoBannerTitle, { color: colors.isDark ? colors.accent : '#92400E' }]}>Langar is free for everyone</Text>
            <Text style={[styles.infoBannerDesc, { color: colors.isDark ? colors.mutedText : '#B45309' }]}> 
              A volunteer will deliver your meal to a partner shelter or community drop-off
            </Text>
          </View>
        </Animated.View>

        {/* Main Courses */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Main Courses</Text>
        <View style={styles.mealsGrid}>
          {mainMeals.map((meal, index) => (
            <MealCard
              key={meal.id}
              meal={meal}
              selected={selectedMeals.has(meal.id)}
              quantity={selectedMeals.get(meal.id)?.quantity ?? 0}
              onPress={() => handleSelectMeal(meal)}
              onIncrement={() => handleIncrement(meal.id)}
              onDecrement={() => handleDecrement(meal.id)}
              index={index}
              colors={colors}
              shadows={shadows}
            />
          ))}
        </View>

        {/* Desserts */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Desserts</Text>
        <View style={styles.mealsGrid}>
          {desserts.map((meal, index) => (
            <MealCard
              key={meal.id}
              meal={meal}
              selected={selectedMeals.has(meal.id)}
              quantity={selectedMeals.get(meal.id)?.quantity ?? 0}
              onPress={() => handleSelectMeal(meal)}
              onIncrement={() => handleIncrement(meal.id)}
              onDecrement={() => handleDecrement(meal.id)}
              index={mainMeals.length + index}
              colors={colors}
              shadows={shadows}
            />
          ))}
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {totalMeals > 0 && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }, shadows.floating]}
        >
          <View style={styles.bottomBarContent}>
            <View style={styles.mealsSummary}>
              <View style={[styles.mealsBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.mealsBadgeText}>{totalMeals}</Text>
              </View>
              <Text style={[styles.mealsLabel, { color: colors.mutedText }]}>
                {totalMeals === 1 ? 'meal' : 'meals'} selected
              </Text>
            </View>
              <Pressable style={[styles.continueButton, { backgroundColor: colors.accent }]} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF8F0" />
            </Pressable>
          </View>
        </Animated.View>
      )}
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoBannerDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  mealCardWrapper: {
    width: '47%',
  },
  mealCard: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 180,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 4,
  },
  mealServings: {
    fontSize: 10,
    fontWeight: '600',
  },
  addBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF8F0',
    minWidth: 20,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF8F0',
  },
  mealsLabel: {
    fontSize: 14,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF8F0',
  },
});
