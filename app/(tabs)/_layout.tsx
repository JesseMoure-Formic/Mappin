import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1e1e1e",
        },
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: "#555",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🗺</Text>,
        }}
      />
      <Tabs.Screen
        name="regions"
        options={{
          title: "Regions",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏛</Text>,
        }}
      />
    </Tabs>
  );
}
