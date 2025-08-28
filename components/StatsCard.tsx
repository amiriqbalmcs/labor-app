import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  theme?: 'light' | 'dark';
}

export function StatsCard({ title, value, icon, color = '#2563eb', theme = 'light' }: StatsCardProps) {
  return (
    <Card style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        {icon && <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>{icon}</View>}
        <Text style={[styles.title, theme === 'dark' && styles.darkTitle]}>{title}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </Card>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
  },
  darkContainer: {
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  darkTitle: {
    color: '#9ca3af',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});