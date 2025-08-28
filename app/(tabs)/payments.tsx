import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, IndianRupee, Calendar, FileText, Trash2 } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { PaymentModal } from '@/components/PaymentModal';
import { CalculationUtils } from '@/utils/calculations';
import { useTranslation } from '@/utils/translations';

export default function PaymentsScreen() {
  const { labors, paymentRecords, deletePayment, isLoading, settings } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLaborId, setSelectedLaborId] = useState<string>('');
  const { t } = useTranslation(settings.language);

  const handleDeletePayment = (paymentId: string) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePayment(paymentId),
        },
      ]
    );
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const paymentsByLabor = getPaymentsByLabor();
  const totalPayments = getTotalPayments();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>
            Total: {CalculationUtils.formatCurrency(totalPayments)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Payment</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {paymentsByLabor.length === 0 ? (
          <View style={styles.emptyState}>
            <IndianRupee size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>{t('noPayments')}</Text>
            <Text style={styles.emptyStateSubtext}>Start by recording your first payment</Text>
          </View>
        ) : (
          paymentsByLabor.map(({ labor, payments }) => (
            <Card key={labor.id} style={styles.laborCard}>
              <View style={styles.laborHeader}>
                <View>
                  <Text style={styles.laborName}>{labor.name}</Text>
                  <Text style={styles.laborInfo}>
                    {payments.length} payment{payments.length !== 1 ? 's' : ''} • 
                    Total: {CalculationUtils.formatCurrency(
                      payments.reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.quickPayButton}
                  onPress={() => {
                    setSelectedLaborId(labor.id);
                    setModalVisible(true);
                  }}
                >
                  <Plus size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <View style={styles.paymentsContainer}>
                {payments.slice(0, 3).map((payment) => (
                  <View key={payment.id} style={styles.paymentItem}>
                    <View style={styles.paymentInfo}>
                      <View style={styles.paymentHeader}>
                        <Text style={styles.paymentAmount}>
                          {CalculationUtils.formatCurrency(payment.amount)}
                        </Text>
                        <Text style={styles.paymentType}>{payment.type}</Text>
                      </View>
                      <Text style={styles.paymentDate}>
                        {CalculationUtils.formatDate(payment.date)}
                      </Text>
                      {payment.notes && (
                        <Text style={styles.paymentNotes}>{payment.notes}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePayment(payment.id)}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {payments.length > 3 && (
                  <Text style={styles.morePayments}>
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
        }}
        selectedLabor={selectedLaborId ? labors.find(l => l.id === selectedLaborId) : undefined}
      />
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
    marginBottom: 8,
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
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
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