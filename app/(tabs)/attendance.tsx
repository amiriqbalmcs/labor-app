import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, CircleCheck as CheckCircle, Circle as XCircle, Clock, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useData } from '@/contexts/DataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { WorkplaceSelector } from '@/components/WorkplaceSelector';
import { Labor } from '@/types';
import { CalculationUtils } from '@/utils/calculations';
import { useTranslation } from '@/utils/translations';

export default function AttendanceScreen() {
  const { labors, attendanceRecords, markAttendance, isLoading, settings, activeWorkplace } = useData();
  const { t } = useTranslation(settings.language);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getTodayAttendance = () => {
    return attendanceRecords.filter(record => record.date === selectedDate);
  };

  const getLaborAttendance = (laborId: string) => {
    return attendanceRecords.find(record => record.laborId === laborId && record.date === selectedDate);
  };

  const handleAttendanceMark = async (status: 'present' | 'absent' | 'half') => {
    if (!selectedLabor) return;

    try {
      await markAttendance(selectedLabor.id, selectedDate, status);
      setModalVisible(false);
      setSelectedLabor(null);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to mark attendance');
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#16a34a';
      case 'absent':
        return '#dc2626';
      case 'half':
        return '#d97706';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={20} color="#16a34a" />;
      case 'absent':
        return <XCircle size={20} color="#dc2626" />;
      case 'half':
        return <Clock size={20} color="#d97706" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const todayAttendance = getTodayAttendance();
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
  const halfCount = todayAttendance.filter(a => a.status === 'half').length;

  return (
    <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
      <WorkplaceSelector theme={settings.theme} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>{t('attendance')}</Text>
          <Text style={[styles.subtitle, settings.theme === 'dark' && styles.darkSubtext]}>
            {activeWorkplace?.name || 'No Workplace'} • {CalculationUtils.formatDate(selectedDate)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.dateButton, settings.theme === 'dark' && styles.darkDateButton]}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={20} color="#2563eb" />
          <Text style={styles.dateButtonText}>{t('changeDate')}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.datePickerModal, settings.theme === 'dark' && styles.darkContainer]}>
            <View style={[styles.datePickerHeader, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerCancel, settings.theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, settings.theme === 'dark' && styles.darkText]}>{t('selectDate')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDone}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={new Date(selectedDate)}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()}
              style={styles.datePickerIOS}
            />
          </SafeAreaView>
        </Modal>
      )}

      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={[styles.navButton, settings.theme === 'dark' && styles.darkNavButton]}
          onPress={() => {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() - 1);
            setSelectedDate(currentDate.toISOString().split('T')[0]);
          }}
        >
          <Text style={[styles.navButtonText, settings.theme === 'dark' && styles.darkText]}>← Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => {
            const today = new Date();
            setSelectedDate(today.toISOString().split('T')[0]);
          }}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, settings.theme === 'dark' && styles.darkNavButton]}
          onPress={() => {
            const currentDate = new Date(selectedDate);
            const today = new Date();
            if (currentDate < today) {
              currentDate.setDate(currentDate.getDate() + 1);
              setSelectedDate(currentDate.toISOString().split('T')[0]);
            }
          }}
        >
          <Text style={[styles.navButtonText, settings.theme === 'dark' && styles.darkText]}>Next →</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryContainer, settings.theme === 'dark' && styles.darkCard]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, settings.theme === 'dark' && styles.darkText]}>{presentCount}</Text>
          <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('present')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, settings.theme === 'dark' && styles.darkText]}>{halfCount}</Text>
          <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('halfDay')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, settings.theme === 'dark' && styles.darkText]}>{absentCount}</Text>
          <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('absent')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, settings.theme === 'dark' && styles.darkText]}>{labors.length - todayAttendance.length}</Text>
          <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('unmarked')}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {labors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, settings.theme === 'dark' && styles.darkText]}>No labors available</Text>
            <Text style={[styles.emptyStateSubtext, settings.theme === 'dark' && styles.darkSubtext]}>Add labors first to mark attendance</Text>
          </View>
        ) : (
          labors.map((labor) => {
            const attendance = getLaborAttendance(labor.id);
            const isMarked = !!attendance;

            return (
              <Card key={labor.id} style={[styles.laborCard, settings.theme === 'dark' && styles.darkCard]}>
                <TouchableOpacity
                  style={styles.laborRow}
                  onPress={() => {
                    setSelectedLabor(labor);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.laborInfo}>
                    <Text style={[styles.laborName, settings.theme === 'dark' && styles.darkText]}>{labor.name}</Text>
                    <Text style={[styles.laborWage, settings.theme === 'dark' && styles.darkSubtext]}>
                      {CalculationUtils.formatCurrency(labor.dailyWage, settings.currency)}/day
                    </Text>
                  </View>

                  <View style={styles.attendanceStatus}>
                    {isMarked ? (
                      <>
                        {getStatusIcon(attendance.status)}
                        <View style={styles.statusInfo}>
                          <Text style={[styles.statusText, { color: getStatusColor(attendance.status) }]}>
                            {t(attendance.status)}
                          </Text>
                          <Text style={[styles.wageText, settings.theme === 'dark' && styles.darkSubtext]}>
                            {CalculationUtils.formatCurrency(attendance.wage, settings.currency)}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View style={[styles.unmarkedStatus, settings.theme === 'dark' && styles.darkUnmarkedStatus]}>
                        <Text style={[styles.unmarkedText, settings.theme === 'dark' && styles.darkSubtext]}>{t('tapToMark')}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Attendance Marking Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, settings.theme === 'dark' && styles.darkContainer]}>
          <View style={[styles.modalHeader, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
            <Text style={[styles.modalTitle, settings.theme === 'dark' && styles.darkText]}>{t('markAttendance')}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {selectedLabor && (
            <View style={styles.modalContent}>
              <View style={[styles.laborDetail, settings.theme === 'dark' && styles.darkLaborDetail]}>
                <Text style={[styles.laborDetailName, settings.theme === 'dark' && styles.darkText]}>{selectedLabor.name}</Text>
                <Text style={[styles.laborDetailWage, settings.theme === 'dark' && styles.darkSubtext]}>
                  {t('dailyWage')}: {CalculationUtils.formatCurrency(selectedLabor.dailyWage, settings.currency)}
                </Text>
                <Text style={[styles.laborDetailDate, settings.theme === 'dark' && styles.darkSubtext]}>
                  Date: {CalculationUtils.formatDate(selectedDate)}
                </Text>
              </View>

              <View style={styles.attendanceOptions}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.presentButton]}
                  onPress={() => handleAttendanceMark('present')}
                >
                  <CheckCircle size={24} color="#ffffff" />
                  <Text style={styles.optionButtonText}>{t('present')}</Text>
                  <Text style={styles.optionWageText}>
                    {CalculationUtils.formatCurrency(selectedLabor.dailyWage, settings.currency)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.halfButton]}
                  onPress={() => handleAttendanceMark('half')}
                >
                  <Clock size={24} color="#ffffff" />
                  <Text style={styles.optionButtonText}>{t('halfDay')}</Text>
                  <Text style={styles.optionWageText}>
                    {CalculationUtils.formatCurrency(selectedLabor.dailyWage / 2, settings.currency)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.absentButton]}
                  onPress={() => handleAttendanceMark('absent')}
                >
                  <XCircle size={24} color="#ffffff" />
                  <Text style={styles.optionButtonText}>{t('absent')}</Text>
                  <Text style={styles.optionWageText}>
                    {CalculationUtils.formatCurrency(0, settings.currency)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  darkDateButton: {
    backgroundColor: '#1e3a8a',
  },
  dateButtonText: {
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 8,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  darkNavButton: {
    backgroundColor: '#374151',
  },
  navButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  todayButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: '#1f2937',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  laborCard: {
    marginBottom: 4,
  },
  laborRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborInfo: {
    flex: 1,
  },
  laborName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  laborWage: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  wageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  unmarkedStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  darkUnmarkedStatus: {
    backgroundColor: '#374151',
  },
  unmarkedText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  laborDetail: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  darkLaborDetail: {
    backgroundColor: '#374151',
  },
  laborDetailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  laborDetailWage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  laborDetailDate: {
    fontSize: 16,
    color: '#6b7280',
  },
  attendanceOptions: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  presentButton: {
    backgroundColor: '#16a34a',
  },
  halfButton: {
    backgroundColor: '#d97706',
  },
  absentButton: {
    backgroundColor: '#dc2626',
  },
  optionButtonText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  optionWageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
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