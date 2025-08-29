import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Banknote, Calendar, FileText, Trash2, CreditCard as Edit3 } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { PaymentModal } from '@/components/PaymentModal';
import { WorkplaceSelector } from '@/components/WorkplaceSelector';
import { CalculationUtils } from '@/utils/calculations';
import { useTranslation } from '@/utils/translations';
import { PaymentRecord } from '@/types';

export default function PaymentsScreen() {
  const { labors, paymentRecords, deletePayment, isLoading, settings, activeWorkplace } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLaborId, setSelectedLaborId] = useState<string>('');
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const { t } = useTranslation(settings.language);

  const handleDeletePayment = (paymentId: string) => {
    Alert.alert(
      t('deletePayment'),
      'Are you sure you want to delete this payment record?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deletePayment(paymentId),
        },
      ]
    );
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setSelectedLaborId(payment.laborId);
    setModalVisible(true);
  };

  const getPaymentsByLabor = () => {
    const paymentsByLabor = new Map();
    
    labors.forEach(labor => {
      const laborPayments = paymentRecords.filter(payment => payment.laborId === labor.id);
      if (laborPayments.length > 0) {
        paymentsByLabor.set(labor.id, {
          labor,
          payments: laborPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        });
      }
    });
    
    return Array.from(paymentsByLabor.values());
  };

  const getTotalPayments = () => {
    return paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getCurrencyIcon = () => {
    switch (settings.currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return '₹';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const paymentsByLabor = getPaymentsByLabor();
  const totalPayments = getTotalPayments();

  return (
    <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>{t('payments')}</Text>
          <Text style={[styles.subtitle, settings.theme === 'dark' && styles.darkSubtext]}>
            {t('total')}: {CalculationUtils.formatCurrency(totalPayments, settings.currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, settings.theme === 'dark' && styles.darkAddButton]}
          onPress={() => {
            setEditingPayment(null);
            setSelectedLaborId('');
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <WorkplaceSelector theme={settings.theme} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {paymentsByLabor.length === 0 ? (
          <View style={styles.emptyState}>
            <Banknote size={48} color="#d1d5db" />
            <Text style={[styles.emptyStateText, settings.theme === 'dark' && styles.darkText]}>{t('noPayments')}</Text>
            <Text style={[styles.emptyStateSubtext, settings.theme === 'dark' && styles.darkSubtext]}>Start by recording your first payment</Text>
          </View>
        ) : (
          paymentsByLabor.map(({ labor, payments }) => (
            <Card key={labor.id} style={[styles.laborCard, settings.theme === 'dark' && styles.darkCard]}>
              <View style={styles.laborHeader}>
                <View>
                  <Text style={[styles.laborName, settings.theme === 'dark' && styles.darkText]}>{labor.name}</Text>
                  <Text style={[styles.laborInfo, settings.theme === 'dark' && styles.darkSubtext]}>
                    {payments.length} payment{payments.length !== 1 ? 's' : ''} • 
                    {t('total')}: {CalculationUtils.formatCurrency(
                      payments.reduce((sum, p) => sum + p.amount, 0),
                      settings.currency
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.quickPayButton, settings.theme === 'dark' && styles.darkQuickPayButton]}
                  onPress={() => {
                    setEditingPayment(null);
                    setSelectedLaborId(labor.id);
                    setModalVisible(true);
                  }}
                >
                  <Plus size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <View style={styles.paymentsContainer}>
                {payments.slice(0, 3).map((payment) => (
                  <View key={payment.id} style={[styles.paymentItem, settings.theme === 'dark' && styles.darkPaymentItem]}>
                    <View style={styles.paymentInfo}>
                      <View style={styles.paymentHeader}>
                        <Text style={styles.paymentAmount}>
                          {CalculationUtils.formatCurrency(payment.amount, settings.currency)}
                        </Text>
                        <Text style={[styles.paymentType, settings.theme === 'dark' && styles.darkPaymentType]}>{payment.type}</Text>
                      </View>
                      <Text style={[styles.paymentDate, settings.theme === 'dark' && styles.darkSubtext]}>
                        {CalculationUtils.formatDate(payment.date)}
                      </Text>
                      {payment.notes && (
                        <Text style={[styles.paymentNotes, settings.theme === 'dark' && styles.darkSubtext]}>{payment.notes}</Text>
                      )}
                    </View>
                    <View style={styles.paymentActions}>
                      <TouchableOpacity
                        style={[styles.editButton, settings.theme === 'dark' && styles.darkEditButton]}
                        onPress={() => handleEditPayment(payment)}
                      >
                        <Edit3 size={16} color="#2563eb" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, settings.theme === 'dark' && styles.darkDeleteButton]}
                        onPress={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {payments.length > 3 && (
                  <Text style={[styles.morePayments, settings.theme === 'dark' && styles.darkSubtext]}>
                    +{payments.length - 3} more payment{payments.length - 3 !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <PaymentModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedLaborId('');
          setEditingPayment(null);
        }}
        selectedLabor={selectedLaborId ? labors.find(l => l.id === selectedLaborId) : undefined}
        editingPayment={editingPayment}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
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
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  darkAddButton: {
    backgroundColor: '#3b82f6',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  laborCard: {
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: '#1f2937',
  },
  laborHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  laborName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  laborInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickPayButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  darkQuickPayButton: {
    backgroundColor: '#1e3a8a',
  },
  paymentsContainer: {
    gap: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  darkPaymentItem: {
    backgroundColor: '#374151',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  paymentType: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  darkPaymentType: {
    backgroundColor: '#4b5563',
    color: '#d1d5db',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  paymentNotes: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  darkEditButton: {
    backgroundColor: '#1e3a8a',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  darkDeleteButton: {
    backgroundColor: '#7f1d1d',
  },
  morePayments: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
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
});