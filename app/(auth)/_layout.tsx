import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="intro" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="password" />
      <Stack.Screen name="set-password" />
    </Stack>
  );
}
