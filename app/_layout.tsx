import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { DataProvider, useData } from '@/contexts/DataContext';

function RootLayoutContent() {
  const { settings, isLoading, workplaces, addWorkplace } = useData();

  useEffect(() => {
    const initializeApp = async () => {
      if (!isLoading) {
        // Create default workplace if none exists
        if (workplaces.length === 0) {
          await addWorkplace({
            name: 'Default Workplace',
            description: 'Your main workplace',
            isActive: true,
          });
        }
        
        if (!settings.hasCompletedOnboarding) {
          router.replace('/onboarding');
        }
      }
    };

    initializeApp();
  }, [settings.hasCompletedOnboarding, isLoading, workplaces.length]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <DataProvider>
      <RootLayoutContent />
    </DataProvider>
  );
}