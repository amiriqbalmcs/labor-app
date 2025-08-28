import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserCheck, UserX, Clock, IndianRupee, Plus, Download, TrendingUp } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatsCard } from '@/components/StatsCard';
import { PaymentModal } from '@/components/PaymentModal';
import { ExportUtils } from '@/utils/exportUtils';
import { CalculationUtils } from '@/utils/calculations';
import { useTranslation } from '@/utils/translations';

export default function DashboardScreen() {
  const { dashboardStats, labors, attendanceRecords, paymentRecords, isLoading, refreshData, settings } = useData();
  const { t } = useTranslation(settings.language);
  const [refreshing, setRefreshing] = React.useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleQuickExport = async () => {
    try {
      setExporting(true);
      await ExportUtils.exportToPDF(labors, attendanceRecords, paymentRecords);
      Alert.alert('Success', 'Report exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Calculate total paid amount
  const totalPaidAmount = paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);
  const totalEarnedAmount = attendanceRecords.reduce((sum, record) => sum + record.wage, 0);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>{t('laborManagement')}</Text>
          <Text style={[styles.subtitle, settings.theme === 'dark' && styles.darkSubtext]}>{t('todaysOverview')}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title={t('totalLabors')}
            value={dashboardStats.totalLabors}
            icon={<Users size={20} color="#2563eb" />}
            color="#2563eb"
            theme={settings.theme}
          />
          <StatsCard
            title={t('presentToday')}
            value={dashboardStats.presentToday}
            icon={<UserCheck size={20} color="#16a34a" />}
            color="#16a34a"
            theme={settings.theme}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title={t('absentToday')}
            value={dashboardStats.absentToday}
            icon={<UserX size={20} color="#dc2626" />}
            color="#dc2626"
            theme={settings.theme}
          />
          <StatsCard
            title={t('halfDayToday')}
            value={dashboardStats.halfDayToday}
            icon={<Clock size={20} color="#d97706" />}
            color="#d97706"
            theme={settings.theme}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title={t('totalEarned')}
            value={CalculationUtils.formatCurrency(totalEarnedAmount, settings.currency)}
            icon={<TrendingUp size={20} color="#16a34a" />}
            color="#16a34a"
            theme={settings.theme}
          />
          <StatsCard
            title={t('totalPaid')}
            value={CalculationUtils.formatCurrency(totalPaidAmount, settings.currency)}
            icon={<IndianRupee size={20} color="#2563eb" />}
            color="#2563eb"
            theme={settings.theme}
          />
        </View>

        <View style={styles.fullWidthCard}>
          <StatsCard
            title={t('totalPendingAmount')}
            value={CalculationUtils.formatCurrency(dashboardStats.totalPendingAmount, settings.currency)}
            icon={<IndianRupee size={24} color="#dc2626" />}
            color="#dc2626"
            theme={settings.theme}
          />
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('quickActions')}</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, settings.theme === 'dark' && styles.darkCard]}
              onPress={() => setPaymentModalVisible(true)}
            >
              <Plus size={24} color="#16a34a" />
              <Text style={[styles.quickActionButtonText, settings.theme === 'dark' && styles.darkText]}>{t('addPayment')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, settings.theme === 'dark' && styles.darkCard, exporting && styles.disabledButton]}
              onPress={handleQuickExport}
              disabled={exporting}
            >
              <Download size={24} color="#2563eb" />
              <Text style={[styles.quickActionButtonText, settings.theme === 'dark' && styles.darkText]}>
                {exporting ? t('loading') : t('exportData')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActionsList}>
            <Text style={[styles.quickActionText, settings.theme === 'dark' && styles.darkSubtext]}>{t('markTodaysAttendance')}</Text>
            <Text style={[styles.quickActionText, settings.theme === 'dark' && styles.darkSubtext]}>{t('addNewLabor')}</Text>
            <Text style={[styles.quickActionText, settings.theme === 'dark' && styles.darkSubtext]}>{t('viewDetailedReports')}</Text>
          </View>
        </View>
      </ScrollView>

      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  darkText: {
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  darkSubtext: {
    color: '#9ca3af',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingVertical: 0,
  },
  fullWidthCard: {
    paddingHorizontal: 12,
  },
  quickActionsSection: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1f2937',
  },
  disabledButton: {
    opacity: 0.5,
  },
  quickActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    textAlign: 'center',
  },
  quickActionsList: {
    marginTop: 8,
  },
  quickActionText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 24,
  },
});