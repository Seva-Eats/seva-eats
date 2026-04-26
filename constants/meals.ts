// Meal options for requesting food
// Using MaterialIcons names for icons

export type MealOption = {
  id: string;
  name: string;
  description: string;
  icon: string; // MaterialIcons name
  iconColor: string;
  backgroundColor: string;
  servings: string;
  category: 'main' | 'side' | 'dessert';
};

export const mealOptions: MealOption[] = [
  {
    id: 'dal-rice',
    name: 'Dal & Rice',
    description: 'Hearty lentils with steamed basmati rice',
    icon: 'rice-bowl',
    iconColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    servings: 'Serves 2-3',
    category: 'main',
  },
  {
    id: 'roti-sabzi',
    name: 'Roti & Sabzi',
    description: 'Fresh chapatis with vegetable curry',
    icon: 'bakery-dining',
    iconColor: '#D97706',
    backgroundColor: '#FED7AA',
    servings: 'Serves 2-3',
    category: 'main',
  },
  {
    id: 'dal-roti',
    name: 'Dal & Roti',
    description: 'Classic lentils with fresh chapatis',
    icon: 'soup-kitchen',
    iconColor: '#EA580C',
    backgroundColor: '#FFEDD5',
    servings: 'Serves 2-3',
    category: 'main',
  },
  {
    id: 'sabzi-rice',
    name: 'Sabzi & Rice',
    description: 'Seasonal vegetable curry with rice',
    icon: 'eco',
    iconColor: '#16A34A',
    backgroundColor: '#DCFCE7',
    servings: 'Serves 2-3',
    category: 'main',
  },
  {
    id: 'sambar-rice',
    name: 'Sambar & Rice',
    description: 'South Indian lentil soup with rice',
    icon: 'ramen-dining',
    iconColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    servings: 'Serves 2-3',
    category: 'main',
  },
  {
    id: 'kheer',
    name: 'Kheer',
    description: 'Sweet rice pudding dessert',
    icon: 'icecream',
    iconColor: '#78716C',
    backgroundColor: '#F5F5F4',
    servings: 'Serves 4',
    category: 'dessert',
  },
];

// Helper to get meal by ID
export function getMealById(id: string): MealOption | undefined {
  return mealOptions.find((m) => m.id === id);
}
