import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserPlus, CreditCard as Edit3, Trash2, Phone, IndianRupee, X, Calendar, FileText } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useTranslation } from '@/utils/translations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { Labor } from '@/types';
import { CalculationUtils } from '@/utils/calculations';

export default function LaborsScreen() {
  const { labors, attendanceRecords, paymentRecords, addLabor, updateLabor, deleteLabor, isLoading, settings } = useData();
  const { t } = useTranslation(settings.language);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editingLabor, setEditingLabor] = useState<Labor | null>(null);
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dailyWage: '',
  });

  const openAddModal = () => {
    setEditingLabor(null);
    setFormData({ name: '', phone: '', dailyWage: '' });
    setModalVisible(true);
  };

  const openEditModal = (labor: Labor) => {
    setEditingLabor(labor);
    setFormData({
      name: labor.name,
      phone: labor.phone,
      dailyWage: labor.dailyWage.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.dailyWage.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    const dailyWage = parseFloat(formData.dailyWage);
    if (isNaN(dailyWage) || dailyWage <= 0) {
      Alert.alert(t('error'), 'Please enter a valid daily wage');
      return;
    }

    try {
      if (editingLabor) {
        await updateLabor(editingLabor.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          dailyWage,
        });
      } else {
        await addLabor({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          dailyWage,
        });
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save labor');
    }
  };

  const openProfile = (labor: Labor) => {
    setSelectedLabor(labor);
    setProfileModalVisible(true);
  };

  const handleDelete = (labor: Labor) => {
    Alert.alert(
      t('deleteLabor'),
      `${t('areYouSureDelete')} ${labor.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteLabor(labor.id),
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getLaborSummary = (labor: Labor) => {
    return CalculationUtils.calculateLaborSummary(labor, attendanceRecords, paymentRecords);
  };

  const getLaborPayments = (laborId: string) => {
    return paymentRecords
      .filter(payment => payment.laborId === laborId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getLaborAttendance = (laborId: string) => {
    return attendanceRecords
      .filter(record => record.laborId === laborId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
          <View>
             <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>{t('labors')}</Text>
            <Text style={[styles.subtitle, settings.theme === 'dark' && styles.darkSubtext]}>{labors.length} {t('totalLaborsCount')}</Text>
          </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <UserPlus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>{t('addLabor')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {labors.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#d1d5db" />
          <Text style={[styles.emptyStateText, settings.theme === 'dark' && styles.darkText]}>{t('noLaborsAdded')}</Text>
          <Text style={[styles.emptyStateSubtext, settings.theme === 'dark' && styles.darkSubtext]}>{t('addFirstLabor')}</Text>
          </View>
        ) : (
          labors.map((labor) => {
            const summary = getLaborSummary(labor);
            return (
              <TouchableOpacity key={labor.id} onPress={() => openProfile(labor)}>
                <Card style={[styles.laborCard, settings.theme === 'dark' && styles.darkCard]}>
                <View style={styles.laborHeader}>
                  <View style={styles.laborInfo}>
                    <Text style={[styles.laborName, settings.theme === 'dark' && styles.darkText]}>{labor.name}</Text>
                    <View style={styles.laborDetails}>
                      <Phone size={16} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <Text style={[styles.laborPhone, settings.theme === 'dark' && styles.darkSubtext]}>{labor.phone}</Text>
                    </View>
                    <View style={styles.laborDetails}>
                      <IndianRupee size={16} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <Text style={[styles.laborWage, settings.theme === 'dark' && styles.darkSubtext]}>
                        {CalculationUtils.formatCurrency(labor.dailyWage, settings.currency)}/day
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, settings.theme === 'dark' && styles.darkActionButton]}
                      onPress={() => openEditModal(labor)}
                    >
                      <Edit3 size={18} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, settings.theme === 'dark' && styles.darkActionButton]}
                      onPress={() => handleDelete(labor)}
                    >
                      <Trash2 size={18} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.laborSummary}>
                  <View style={styles.summaryItem}>
                   <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('earned')}</Text>
                    <Text style={[styles.summaryValue, settings.theme === 'dark' && styles.darkText]}>
                      {CalculationUtils.formatCurrency(summary.totalEarned, settings.currency)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                   <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('paid')}</Text>
                    <Text style={[styles.summaryValue, settings.theme === 'dark' && styles.darkText]}>
                      {CalculationUtils.formatCurrency(summary.totalPaid, settings.currency)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                   <Text style={[styles.summaryLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('pending')}</Text>
                    <Text style={[styles.summaryValue, { color: summary.pendingBalance > 0 ? '#dc2626' : '#16a34a' }]}>
                      {CalculationUtils.formatCurrency(summary.pendingBalance, settings.currency)}
                    </Text>
                  </View>
                </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, settings.theme === 'dark' && styles.darkContainer]}>
          <View style={[styles.modalHeader, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
            <Text style={[styles.modalTitle, settings.theme === 'dark' && styles.darkText]}>
              {editingLabor ? t('editLabor') : t('addNewLabor')}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, settings.theme === 'dark' && styles.darkText]}>{t('fullName')}</Text>
              <TextInput
                style={[styles.input, settings.theme === 'dark' && styles.darkInput]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('enterFullName')}
                placeholderTextColor={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, settings.theme === 'dark' && styles.darkText]}>{t('phoneNumber')}</Text>
              <TextInput
                style={[styles.input, settings.theme === 'dark' && styles.darkInput]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder={t('enterPhoneNumber')}
                placeholderTextColor={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, settings.theme === 'dark' && styles.darkText]}>{t('dailyWage')}</Text>
              <TextInput
                style={[styles.input, settings.theme === 'dark' && styles.darkInput]}
                value={formData.dailyWage}
                onChangeText={(text) => setFormData({ ...formData, dailyWage: text })}
                placeholder={t('enterDailyWage')}
                placeholderTextColor={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, settings.theme === 'dark' && styles.darkCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, settings.theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingLabor ? t('update') : t('add')} {t('labor')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Labor Profile Modal */}
      <Modal visible={profileModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, settings.theme === 'dark' && styles.darkContainer]}>
          <View style={[styles.modalHeader, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
            <Text style={[styles.modalTitle, settings.theme === 'dark' && styles.darkText]}>{t('laborProfile')}</Text>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
              <X size={24} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {selectedLabor && (
            <ScrollView style={styles.profileContent}>
              {/* Labor Info */}
              <Card style={[styles.profileSection, settings.theme === 'dark' && styles.darkCard]}>
                <Text style={[styles.profileSectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('personalInformation')}</Text>
                <View style={styles.profileInfoRow}>
                  <Text style={[styles.profileLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('name')}:</Text>
                  <Text style={[styles.profileValue, settings.theme === 'dark' && styles.darkText]}>{selectedLabor.name}</Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={[styles.profileLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('phone')}:</Text>
                  <Text style={[styles.profileValue, settings.theme === 'dark' && styles.darkText]}>{selectedLabor.phone}</Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={[styles.profileLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('dailyWage')}:</Text>
                  <Text style={[styles.profileValue, settings.theme === 'dark' && styles.darkText]}>
                    {CalculationUtils.formatCurrency(selectedLabor.dailyWage, settings.currency)}
                  </Text>
                </View>
              </Card>

              {/* Financial Summary */}
              <Card style={[styles.profileSection, settings.theme === 'dark' && styles.darkCard]}>
                <Text style={[styles.profileSectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('financialSummary')}</Text>
                {(() => {
                  const summary = getLaborSummary(selectedLabor);
                  return (
                    <View style={styles.financialGrid}>
                      <View style={styles.financialItem}>
                        <Text style={[styles.financialValue, settings.theme === 'dark' && styles.darkText]}>
                          {CalculationUtils.formatCurrency(summary.totalEarned, settings.currency)}
                        </Text>
                        <Text style={[styles.financialLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('totalEarned')}</Text>
                      </View>
                      <View style={styles.financialItem}>
                        <Text style={[styles.financialValue, settings.theme === 'dark' && styles.darkText]}>
                          {CalculationUtils.formatCurrency(summary.totalPaid, settings.currency)}
                        </Text>
                        <Text style={[styles.financialLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('totalPaid')}</Text>
                      </View>
                      <View style={styles.financialItem}>
                        <Text style={[
                          styles.financialValue,
                          { color: summary.pendingBalance > 0 ? '#dc2626' : '#16a34a' }
                        ]}>
                          {CalculationUtils.formatCurrency(summary.pendingBalance, settings.currency)}
                        </Text>
                        <Text style={[styles.financialLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('pending')}</Text>
                      </View>
                    </View>
                  );
                })()}
              </Card>

              {/* Payment History */}
              <Card style={[styles.profileSection, settings.theme === 'dark' && styles.darkCard]}>
                <Text style={[styles.profileSectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('paymentHistory')}</Text>
                {(() => {
                  const payments = getLaborPayments(selectedLabor.id);
                  return payments.length === 0 ? (
                    <Text style={[styles.noDataText, settings.theme === 'dark' && styles.darkSubtext]}>{t('noPayments')}</Text>
                  ) : (
                    <View style={styles.historyContainer}>
                      {payments.slice(0, 5).map((payment) => (
                        <View key={payment.id} style={[styles.historyItem, settings.theme === 'dark' && styles.darkHistoryItem]}>
                          <View style={styles.historyInfo}>
                            <Text style={styles.historyAmount}>
                              {CalculationUtils.formatCurrency(payment.amount, settings.currency)}
                            </Text>
                            <Text style={[styles.historyDate, settings.theme === 'dark' && styles.darkSubtext]}>
                              {CalculationUtils.formatDate(payment.date)} • {payment.type}
                            </Text>
                            {payment.notes && (
                              <Text style={[styles.historyNotes, settings.theme === 'dark' && styles.darkSubtext]}>{payment.notes}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                      {payments.length > 5 && (
                        <Text style={[styles.moreHistoryText, settings.theme === 'dark' && styles.darkSubtext]}>
                          +{payments.length - 5} more payment{payments.length - 5 !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  );
                })()}
              </Card>

              {/* Attendance Summary */}
              <Card style={[styles.profileSection, settings.theme === 'dark' && styles.darkCard]}>
               <Text style={[styles.profileSectionTitle, settings.theme === 'dark' && styles.darkText]}>{t('attendanceSummary')}</Text>
                {(() => {
                  const summary = getLaborSummary(selectedLabor);
                  return (
                    <View style={styles.attendanceGrid}>
                      <View style={styles.attendanceItem}>
                        <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{summary.totalDaysPresent}</Text>
                       <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('present')}</Text>
                      </View>
                      <View style={styles.attendanceItem}>
                        <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{summary.totalDaysHalf}</Text>
                       <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('halfDay')}</Text>
                      </View>
                      <View style={styles.attendanceItem}>
                        <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{summary.totalDaysAbsent}</Text>
                       <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('absent')}</Text>
                      </View>
                      <View style={styles.attendanceItem}>
                        <Text style={[styles.attendanceCount, settings.theme === 'dark' && styles.darkText]}>{summary.totalDaysWorked}</Text>
                       <Text style={[styles.attendanceLabel, settings.theme === 'dark' && styles.darkSubtext]}>{t('total')}</Text>
                      </View>
                    </View>
                  );
                })()}
              </Card>
            </ScrollView>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  laborCard: {
    marginBottom: 4,
  },
  darkCard: {
    backgroundColor: '#1f2937',
  },
  laborHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  laborInfo: {
    flex: 1,
  },
  laborName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  laborDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  laborPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  laborWage: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  darkActionButton: {
    backgroundColor: '#374151',
  },
  laborSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
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
    textAlign: 'center',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  darkInput: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  darkCancelButton: {
    borderColor: '#4b5563',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  profileContent: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    marginBottom: 16,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  financialItem: {
    alignItems: 'center',
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyContainer: {
    gap: 8,
  },
  historyItem: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  darkHistoryItem: {
    backgroundColor: '#374151',
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  historyNotes: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  moreHistoryText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  attendanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    padding: 20,
  },
});