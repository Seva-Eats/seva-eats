import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="slide1" />
      <Stack.Screen name="slide2" />
      <Stack.Screen name="slide3" />
    </Stack>
  );
}
