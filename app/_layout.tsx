import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { DataProvider, useData } from "@/contexts/DataContext";

function RootLayoutContent() {
  const { settings } = useData();

  // Safely redirect if onboarding not complete
  if (!settings?.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={settings?.theme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady(); // Safe, only sets up once

  return (
    <DataProvider>
      <RootLayoutContent />
    </DataProvider>
  );
}
