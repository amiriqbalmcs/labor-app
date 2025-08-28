import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, Calendar, ChevronDown } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Labor } from '@/types';
import { useData } from '@/contexts/DataContext';
import { CalculationUtils } from '@/utils/calculations';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLabor?: Labor;
}

export function PaymentModal({ visible, onClose, selectedLabor }: PaymentModalProps) {
  const { labors, addPayment, attendanceRecords, paymentRecords } = useData();
  const [formData, setFormData] = useState({
    laborId: selectedLabor?.id || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'partial',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  React.useEffect(() => {
    if (selectedLabor) {
      setFormData(prev => ({ ...prev, laborId: selectedLabor.id }));
    }
  }, [selectedLabor]);

  const handleSave = async () => {
    if (!formData.laborId || !formData.amount.trim()) {
      Alert.alert('Error', 'Please select a labor and enter amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addPayment({
        laborId: formData.laborId,
        amount,
        date: formData.date,
        type: formData.type,
        notes: formData.notes.trim(),
      });
      
      setFormData({
        laborId: selectedLabor?.id || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'daily',
        notes: '',
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Payment</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Labor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.laborId}
                onValueChange={(itemValue) => setFormData({ ...formData, laborId: itemValue })}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Choose a labor..." value="" />
                {labors.map((labor) => (
                  <Picker.Item
                    key={labor.id}
                    label={`${labor.name} - ₹${labor.dailyWage}/day`}
                    value={labor.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {selectedLaborData && (
            <View style={styles.selectedLaborInfo}>
              <Text style={styles.selectedLaborName}>{selectedLaborData.name}</Text>
              <Text style={styles.selectedLaborWage}>
                Daily Wage: ₹{selectedLaborData.dailyWage}
              </Text>
              {selectedLaborSummary && (
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingLabel}>Pending Balance:</Text>
                  <Text style={[
                    styles.pendingAmount,
                    { color: selectedLaborSummary.pendingBalance > 0 ? '#dc2626' : '#16a34a' }
                  ]}>
                    {CalculationUtils.formatCurrency(selectedLaborSummary.pendingBalance)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity
              style={styles.dateDisplay}
              onPress={() => setShowDatePicker(true)}
            >
                <Calendar size={20} color="#6b7280" />
                <Text style={styles.dateDisplayText}>
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
            <Text style={styles.label}>Amount (₹)</Text>
            <View style={styles.amountInputContainer}>
              <IndianRupee size={20} color="#6b7280" />
              <TextInput
                style={styles.amountInput}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Type</Text>
            <View style={styles.typeSelector}>
              {(['daily', 'weekly', 'monthly', 'partial'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.type === type && styles.selectedTypeOption,
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.type === type && styles.selectedTypeOptionText,
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add notes about this payment"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Record Payment</Text>
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
  picker: {
    height: 60,
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
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
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
  selectedTypeOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#6b7280',
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