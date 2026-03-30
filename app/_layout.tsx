import { Stack, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

// Tabs for the main bottom nav; detail screens use a Stack inside
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="region/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="create-region" options={{ presentation: "modal" }} />
    </Stack>
  );
}
