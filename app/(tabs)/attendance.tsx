import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, CircleCheck as CheckCircle, Circle as XCircle, Clock, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useData } from '@/contexts/DataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { Labor } from '@/types';
import { CalculationUtils } from '@/utils/calculations';

export default function AttendanceScreen() {
  const { labors, attendanceRecords, markAttendance, isLoading } = useData();
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
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  // ✅ Fixed: renamed parameter to `date`
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>{CalculationUtils.formatDate(selectedDate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={20} color="#2563eb" />
          <Text style={styles.dateButtonText}>Change Date</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Single date picker logic */}
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
          <SafeAreaView style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDone}>Done</Text>
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
          style={styles.navButton}
          onPress={() => {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() - 1);
            setSelectedDate(currentDate.toISOString().split('T')[0]);
          }}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
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
          style={styles.navButton}
          onPress={() => {
            const currentDate = new Date(selectedDate);
            const today = new Date();
            if (currentDate < today) {
              currentDate.setDate(currentDate.getDate() + 1);
              setSelectedDate(currentDate.toISOString().split('T')[0]);
            }
          }}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{halfCount}</Text>
          <Text style={styles.summaryLabel}>Half Day</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{labors.length - todayAttendance.length}</Text>
          <Text style={styles.summaryLabel}>Unmarked</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {labors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No labors available</Text>
            <Text style={styles.emptyStateSubtext}>Add labors first to mark attendance</Text>
          </View>
        ) : (
          labors.map((labor) => {
            const attendance = getLaborAttendance(labor.id);
            const isMarked = !!attendance;

            return (
              <Card key={labor.id} style={styles.laborCard}>
                <TouchableOpacity
                  style={styles.laborRow}
                  onPress={() => {
                    setSelectedLabor(labor);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.laborInfo}>
                    <Text style={styles.laborName}>{labor.name}</Text>
                    <Text style={styles.laborWage}>
                      {CalculationUtils.formatCurrency(labor.dailyWage)}/day
                    </Text>
                  </View>

                  <View style={styles.attendanceStatus}>
                    {isMarked ? (
                      <>
                        {getStatusIcon(attendance.status)}
                        <View style={styles.statusInfo}>
                          <Text style={[styles.statusText, { color: getStatusColor(attendance.status) }]}>
                            {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                          </Text>
                          <Text style={styles.wageText}>
                            {CalculationUtils.formatCurrency(attendance.wage)}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.unmarkedStatus}>
                        <Text style={styles.unmarkedText}>Tap to mark</Text>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mark Attendance</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedLabor && (
            <View style={styles.modalContent}>
              <View style={styles.laborDetail}>
                <Text style={styles.laborDetailName}>{selectedLabor.name}</Text>
                <Text style={styles.laborDetailWage}>
                  Daily Wage: {CalculationUtils.formatCurrency(selectedLabor.dailyWage)}
                </Text>
                <Text style={styles.laborDetailDate}>
                  Date: {CalculationUtils.formatDate(selectedDate)}
                </Text>
              </View>

              <View style={styles.attendanceOptions}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.presentButton]}
                  onPress={() => handleAttendanceMark('present')}
                >
                  <CheckCircle size={24} color="#ffffff" />
                  <Text style={styles.optionButtonText}>Present</Text>
                  <Text style={styles.optionWageText}>
                    {CalculationUtils.formatCurrency(selectedLabor.dailyWage)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.halfButton]}
                  onPress={() => handleAttendanceMark('half')}
                >
                  <Clock size={24} color="#ffffff" />
                  <Text style={styles.optionButtonText}>Half Day</Text>
                  <Text style={styles.optionWageText}>
                    {CalculationUtils.formatCurrency(selectedLabor.dailyWage / 2)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.absentButton]}
                  onPress={() => handleAttendanceMark('absent')}
                >
                  <XCircle size={24} color="#ffffff" />
                  <Text style={styles.optionButtonText}>Absent</Text>
                  <Text style={styles.optionWageText}>₹0</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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