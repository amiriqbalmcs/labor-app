import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, Calendar, ChevronDown, DollarSign } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Labor, PaymentRecord } from '@/types';
import { useData } from '@/contexts/DataContext';
import { CalculationUtils } from '@/utils/calculations';
import { useTranslation } from '@/utils/translations';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLabor?: Labor;
  editingPayment?: PaymentRecord | null;
}

export function PaymentModal({ visible, onClose, selectedLabor, editingPayment }: PaymentModalProps) {
  const { labors, addPayment, updatePayment, attendanceRecords, paymentRecords, settings } = useData();
  const { t } = useTranslation(settings.language);
  const [formData, setFormData] = useState({
    laborId: selectedLabor?.id || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'partial',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        laborId: editingPayment.laborId,
        amount: editingPayment.amount.toString(),
        date: editingPayment.date,
        type: editingPayment.type,
        notes: editingPayment.notes || '',
      });
    } else if (selectedLabor) {
      setFormData(prev => ({ 
        ...prev, 
        laborId: selectedLabor.id,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'daily',
        notes: '',
      }));
    }
  }, [selectedLabor, editingPayment]);

  const handleSave = async () => {
    if (!formData.laborId || !formData.amount.trim()) {
      Alert.alert(t('error'), 'Please select a labor and enter amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }

    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, {
          laborId: formData.laborId,
          amount,
          date: formData.date,
          type: formData.type,
          notes: formData.notes.trim(),
        });
      } else {
        await addPayment({
          laborId: formData.laborId,
          amount,
          date: formData.date,
          type: formData.type,
          notes: formData.notes.trim(),
        });
      }
      
      setFormData({
        laborId: selectedLabor?.id || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'daily',
        notes: '',
      });
      onClose();
    } catch (error) {
      Alert.alert(t('error'), 'Failed to record payment');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const selectedLaborData = labors.find(l => l.id === formData.laborId);
  const selectedLaborSummary = selectedLaborData 
    ? CalculationUtils.calculateLaborSummary(selectedLaborData, attendanceRecords, paymentRecords)
    : null;

  const getCurrencyIcon = () => {
    switch (settings.currency) {
      case 'USD':
        return <DollarSign size={20} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />;
      case 'EUR':
        return <Text style={{ fontSize: 20, color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>€</Text>;
      case 'GBP':
        return <Text style={{ fontSize: 20, color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>£</Text>;
        case 'PKR':
        return <Text style={{ fontSize: 20, color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Rs</Text>:
      default:
        return <IndianRupee size={20} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
        <View style={[styles.header, settings.theme === 'dark' && { borderBottomColor: '#374151' }]}>
          <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>
            {editingPayment ? t('editPayment') : t('addNewPayment')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, settings.theme === 'dark' && styles.darkText]}>{t('selectLabor')}</Text>
            <View style={[styles.pickerContainer, settings.theme === 'dark' && styles.darkPickerContainer]}>
              <Picker
                selectedValue={formData.laborId}
                onValueChange={(itemValue) => setFormData({ ...formData, laborId: itemValue })}
                style={[styles.picker, settings.theme === 'dark' && styles.darkPicker]}
                itemStyle={styles.pickerItem}
                enabled={!editingPayment}
              >
                <Picker.Item label={t('selectLabor') + "..."} value="" />
                {labors.map((labor) => (
                  <Picker.Item
                    key={labor.id}
                    label={`${labor.name} - ${CalculationUtils.formatCurrency(labor.dailyWage, settings.currency)}/day`}
                    value={labor.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {selectedLaborData && (
            <View style={[styles.selectedLaborInfo, settings.theme === 'dark' && styles.darkSelectedLaborInfo]}>
              <Text style={[styles.selectedLaborName, settings.theme === 'dark' && styles.darkText]}>{selectedLaborData.name}</Text>
              <Text style={[styles.selectedLaborWage, settings.theme === 'dark' && styles.darkSubtext]}>
                {t('dailyWage')}: {CalculationUtils.formatCurrency(selectedLaborData.dailyWage, settings.currency)}
              </Text>
              {selectedLaborSummary && (
                <View style={[styles.pendingInfo, settings.theme === 'dark' && { borderTopColor: '#4b5563' }]}>
                  <Text style={[styles.pendingLabel, settings.theme === 'dark' && styles.darkText]}>{t('pending')} Balance:</Text>
                  <Text style={[
                    styles.pendingAmount,
                    { color: selectedLaborSummary.pendingBalance > 0 ? '#dc2626' : '#16a34a' }
                  ]}>
                    {CalculationUtils.formatCurrency(selectedLaborSummary.pendingBalance, settings.currency)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, settings.theme === 'dark' && styles.darkText]}>{t('paymentDate')}</Text>
            <TouchableOpacity
              style={[styles.dateDisplay, settings.theme === 'dark' && styles.darkDateDisplay]}
              onPress={() => setShowDatePicker(true)}
            >
                <Calendar size={20} color={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Text style={[styles.dateDisplayText, settings.theme === 'dark' && styles.darkText]}>
                  {CalculationUtils.formatDate(formData.date)}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => setFormData({ ...formData, date: new Date().toISOString().split('T')[0] })}
            >
              <Text style={styles.todayButtonText}>Set to Today</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            Platform.OS === 'ios' ? (
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
                    value={new Date(formData.date)}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    style={styles.datePickerIOS}
                  />
                </SafeAreaView>
              </Modal>
            ) : (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, settings.theme === 'dark' && styles.darkText]}>{t('amount')} ({settings.currency})</Text>
            <View style={[styles.amountInputContainer, settings.theme === 'dark' && styles.darkAmountInputContainer]}>
              {getCurrencyIcon()}
              <TextInput
                style={[styles.amountInput, settings.theme === 'dark' && styles.darkAmountInput]}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder={t('amount')}
                placeholderTextColor={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, settings.theme === 'dark' && styles.darkText]}>{t('paymentType')}</Text>
            <View style={styles.typeSelector}>
              {(['daily', 'weekly', 'monthly', 'partial'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    settings.theme === 'dark' && styles.darkTypeOption,
                    formData.type === type && styles.selectedTypeOption,
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    settings.theme === 'dark' && styles.darkTypeOptionText,
                    formData.type === type && styles.selectedTypeOptionText,
                  ]}>
                    {t(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, settings.theme === 'dark' && styles.darkText]}>{t('notes')} (Optional)</Text>
            <TextInput
              style={[styles.notesInput, settings.theme === 'dark' && styles.darkNotesInput]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add notes about this payment"
              placeholderTextColor={settings.theme === 'dark' ? '#9ca3af' : '#6b7280'}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.cancelButton, settings.theme === 'dark' && styles.darkCancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, settings.theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingPayment ? t('update') : 'Record'} {t('payments')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  darkText: {
    color: '#f9fafb',
  },
  darkSubtext: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  laborSelector: {
    flexDirection: 'row',
  },
  laborOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  selectedLaborOption: {
    backgroundColor: '#2563eb',
  },
  laborOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedLaborOptionText: {
    color: '#ffffff',
  },
  selectedLaborInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  darkSelectedLaborInfo: {
    backgroundColor: '#1e3a8a',
  },
  selectedLaborName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedLaborWage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  pendingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  pendingLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  darkPickerContainer: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  picker: {
    height: 60,
    color: '#1f2937',
  },
  darkPicker: {
    color: '#f9fafb',
  },
  pickerItem: {
    fontSize: 16,
    height: 60,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  darkDateDisplay: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  dateDisplayText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  todayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  darkAmountInputContainer: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  darkAmountInput: {
    color: '#f9fafb',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  darkTypeOption: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  selectedTypeOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  darkTypeOptionText: {
    color: '#d1d5db',
  },
  selectedTypeOptionText: {
    color: '#ffffff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    color: '#1f2937',
  },
  darkNotesInput: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  actions: {
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
});