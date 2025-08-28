import { Tabs } from 'expo-router';
import { Users, Calendar, ChartBar as BarChart3, IndianRupee, Settings } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useTranslation } from '@/utils/translations';

export default function TabLayout() {
  const { settings } = useData();
  const { t } = useTranslation(settings.language);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: settings.theme === 'dark' ? '#60a5fa' : '#2563eb',
        tabBarInactiveTintColor: settings.theme === 'dark' ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: settings.theme === 'dark' ? '#374151' : '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="labors"
        options={{
          title: t('labors'),
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: t('attendance'),
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: t('payments'),
          tabBarIcon: ({ size, color }) => (
            <IndianRupee size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}