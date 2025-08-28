import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Calendar, Filter, TrendingUp, IndianRupee, Users, Download, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useData } from '@/contexts/DataContext';
import { useTranslation } from '@/utils/translations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { StatsCard } from '@/components/StatsCard';
import { ExportUtils } from '@/utils/exportUtils';
import { CalculationUtils } from '@/utils/calculations';
import { ReportFilters } from '@/types';

export default function ReportsScreen() {
  const { labors, attendanceRecords, paymentRecords, isLoading, settings } = useData();
  const { t } = useTranslation(settings.language);
  const [filters, setFilters] = useState<ReportFilters>({ period: 'month' });
  const [exporting, setExporting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleExportReport = async () => {
    try {
      setExporting(true);
      await ExportUtils.exportToPDF(labors, attendanceRecords, paymentRecords, filters);
      Alert.alert(t('success'), t('dataExported'));
    } catch (error) {
      Alert.alert(t('error'), t('exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setFilters({
        ...filters,
        startDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setFilters({
        ...filters,
        endDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const reportData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (filters.period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (filters.startDate && filters.endDate) {
          startDate = new Date(filters.startDate);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const endDate = filters.period === 'custom' && filters.endDate ? new Date(filters.endDate) : now;
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    // Filter records for the selected period
    const filteredAttendance = attendanceRecords.filter(
      record => record.date >= startDateString && record.date <= endDateString
    );
    
    const filteredPayments = paymentRecords.filter(
      record => record.date >= startDateString && record.date <= endDateString
    );

    // Calculate totals
    const totalEarned = filteredAttendance.reduce((sum, record) => sum + record.wage, 0);
    const totalPaid = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPending = labors.reduce((sum, labor) => {
      const summary = CalculationUtils.calculateLaborSummary(labor, attendanceRecords, paymentRecords);
      return sum + summary.pendingBalance;
    }, 0);

    // Attendance statistics
    const totalDays = filteredAttendance.length;
    const presentDays = filteredAttendance.filter(record => record.status === 'present').length;
    const halfDays = filteredAttendance.filter(record => record.status === 'half').length;
    const absentDays = filteredAttendance.filter(record => record.status === 'absent').length;

    // Top performers
    const laborPerformance = labors.map(labor => {
      const laborAttendance = filteredAttendance.filter(record => record.laborId === labor.id);
      const totalWorked = laborAttendance.filter(record => record.status !== 'absent').length;
      const totalEarnedByLabor = laborAttendance.reduce((sum, record) => sum + record.wage, 0);
      
      return {
        labor,
        totalWorked,
        totalEarned: totalEarnedByLabor,
        attendanceRate: laborAttendance.length > 0 ? (totalWorked / laborAttendance.length) * 100 : 0,
      };
    }).sort((a, b) => b.totalEarned - a.totalEarned);

    return {
      period: filters.period,
      startDate: startDateString,
      endDate: endDateString,
      totalEarned,
      totalPaid,
      totalPending,
      totalDays,
      presentDays,
      halfDays,
      absentDays,
      topPerformers: laborPerformance.slice(0, 5),
    };
  }, [labors, attendanceRecords, paymentRecords, filters]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week':
        return t('thisWeek');
      case 'month':
        return t('thisMonth');
      case 'custom':
        return t('customRange');
      default:
        return t('thisMonth');
    }
  };

  return (
    <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>{t('reports')}</Text>
          <Text style={[styles.subtitle, settings.theme === 'dark' && styles.darkSubtext]}>{getPeriodLabel(filters.period)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.disabledButton]}
          onPress={handleExportReport}
          disabled={exporting}
        >
          <Download size={18} color="#ffffff" />
          <Text style={styles.exportButtonText}>
            {exporting ? t('loading') : t('exportReport')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['week', 'month', 'custom'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterButton,
              filters.period === period && styles.activeFilterButton,
              settings.theme === 'dark' && styles.darkFilterButton,
              filters.period === period && settings.theme === 'dark' && styles.darkActiveFilterButton,
            ]}
            onPress={() => setFilters({ period })}
          >
            <Text
              style={[
                styles.filterButtonText,
                filters.period === period && styles.activeFilterButtonText,
                settings.theme === 'dark' && styles.darkFilterButtonText,
                filters.period === period && settings.theme === 'dark' && styles.darkActiveFilterButtonText,
              ]}
            >
              {period === 'custom' ? t('customRange') : period === 'week' ? t('thisWeek') : t('thisMonth')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filters.period === 'custom' && (
        <View style={[styles.customDateContainer, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, settings.theme === 'dark' && styles.darkText]}>{t('from')}:</Text>
            <TouchableOpacity
              style={[styles.dateButton, settings.theme === 'dark' && styles.darkDateButton]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Calendar size={16} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.dateButtonText, settings.theme === 'dark' && styles.darkText]}>
                {filters.startDate ? CalculationUtils.formatDate(filters.startDate) : t('selectDate')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, settings.theme === 'dark' && styles.darkText]}>{t('to')}:</Text>
            <TouchableOpacity
              style={[styles.dateButton, settings.theme === 'dark' && styles.darkDateButton]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Calendar size={16} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.dateButtonText, settings.theme === 'dark' && styles.darkText]}>
                {filters.endDate ? CalculationUtils.formatDate(filters.endDate) : t('selectDate')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Financial Summary */}
        <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('financialOverview')}</Text>
        <View style={styles.statsGrid}>
          <StatsCard
            title={t('totalEarned')}
            value={CalculationUtils.formatCurrency(reportData.totalEarned, settings.currency)}
            icon={<TrendingUp size={20} color="#16a34a" />}
            color="#16a34a"
            theme={settings.theme}
          />
          <StatsCard
            title={t('totalPaid')}
            value={CalculationUtils.formatCurrency(reportData.totalPaid, settings.currency)}
            icon={<IndianRupee size={20} color="#2563eb" />}
            color="#2563eb"
            theme={settings.theme}
          />
        </View>
        
        <View style={styles.fullWidthStats}>
          <StatsCard
            title={t('pendingAmount')}
            value={CalculationUtils.formatCurrency(reportData.totalPending, settings.currency)}
            icon={<IndianRupee size={20} color="#dc2626" />}
            color="#dc2626"
            theme={settings.theme}
          />
        </View>

        {/* Attendance Summary */}
        <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('attendanceSummary')}</Text>
        <Card style={[styles.attendanceSummary, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{reportData.presentDays}</Text>
              <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('presentDays')}</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{reportData.halfDays}</Text>
              <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('halfDays')}</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{reportData.absentDays}</Text>
              <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('absentDays')}</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{reportData.totalDays}</Text>
              <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('totalDays')}</Text>
            </View>
          </View>
        </Card>

        {/* Top Performers */}
        <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('topPerformers')}</Text>
        {reportData.topPerformers.length === 0 ? (
          <Card style={[{}, settings.theme === 'dark' && styles.darkCard]}>
            <Text style={[styles.noDataText, settings.theme === 'dark' && styles.darkSubtext]}>{t('noData')}</Text>
          </Card>
        ) : (
          reportData.topPerformers.map((performer, index) => (
            <Card key={performer.labor.id} style={[styles.performerCard, settings.theme === 'dark' && styles.darkCard]}>
              <View style={styles.performerHeader}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={[styles.performerName, settings.theme === 'dark' && styles.darkText]}>{performer.labor.name}</Text>
                  <Text style={[styles.performerDetails, settings.theme === 'dark' && styles.darkSubtext]}>
                    {performer.totalWorked} days worked • {performer.attendanceRate.toFixed(1)}% attendance
                  </Text>
                </View>
                <View style={styles.performerEarnings}>
                  <Text style={styles.earningsAmount}>
                    {CalculationUtils.formatCurrency(performer.totalEarned, settings.currency)}
                  </Text>
                  <Text style={[styles.earningsLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('earned')}</Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Report Period Info */}
        <Card style={[styles.periodInfo, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.periodHeader}>
            <Calendar size={20} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.periodTitle, settings.theme === 'dark' && styles.darkText]}>{t('reportPeriod')}</Text>
          </View>
          <Text style={[styles.periodText, settings.theme === 'dark' && styles.darkSubtext]}>
            {t('from')}: {CalculationUtils.formatDate(reportData.startDate)}
          </Text>
          <Text style={[styles.periodText, settings.theme === 'dark' && styles.darkSubtext]}>
            {t('to')}: {CalculationUtils.formatDate(reportData.endDate)}
          </Text>
        </Card>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={showStartDatePicker} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.datePickerModal, settings.theme === 'dark' && styles.darkContainer]}>
              <View style={[styles.datePickerHeader, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                  <Text style={[styles.datePickerCancel, settings.theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, settings.theme === 'dark' && styles.darkText]}>{t('selectDate')}</Text>
                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                  <Text style={styles.datePickerDone}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={filters.startDate ? new Date(filters.startDate) : new Date()}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                maximumDate={new Date()}
                style={styles.datePickerIOS}
              />
            </SafeAreaView>
          </Modal>
        ) : (
          <DateTimePicker
            value={filters.startDate ? new Date(filters.startDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            maximumDate={new Date()}
          />
        )
      )}

      {showEndDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={showEndDatePicker} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.datePickerModal, settings.theme === 'dark' && styles.darkContainer]}>
              <View style={[styles.datePickerHeader, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={[styles.datePickerCancel, settings.theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, settings.theme === 'dark' && styles.darkText]}>{t('selectDate')}</Text>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={styles.datePickerDone}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={filters.endDate ? new Date(filters.endDate) : new Date()}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                maximumDate={new Date()}
                style={styles.datePickerIOS}
              />
            </SafeAreaView>
          </Modal>
        ) : (
          <DateTimePicker
            value={filters.endDate ? new Date(filters.endDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            maximumDate={new Date()}
          />
        )
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  darkText: {
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  darkSubtext: {
    color: '#9ca3af',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  darkFilterButton: {
    backgroundColor: '#374151',
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
  },
  darkActiveFilterButton: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  darkFilterButtonText: {
    color: '#d1d5db',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  darkActiveFilterButtonText: {
    color: '#ffffff',
  },
  customDateContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    gap: 12,
  },
  darkCard: {
    backgroundColor: '#1f2937',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 2,
  },
  darkDateButton: {
    backgroundColor: '#374151',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  fullWidthStats: {
    paddingHorizontal: 12,
  },
  attendanceSummary: {
    marginHorizontal: 16,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  performerCard: {
    marginBottom: 4,
  },
  performerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  performerDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  performerEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 2,
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  periodInfo: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  periodText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    padding: 20,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  datePickerIOS: {
    flex: 1,
  },
});