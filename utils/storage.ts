import AsyncStorage from '@react-native-async-storage/async-storage';
import { Labor, AttendanceRecord, PaymentRecord, AppSettings } from '@/types';

const STORAGE_KEYS = {
  LABORS: '@labors',
  ATTENDANCE: '@attendance',
  PAYMENTS: '@payments',
  SETTINGS: '@settings',
};

export const StorageUtils = {
  // Labor operations
  async getLabors(): Promise<Labor[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LABORS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting labors:', error);
      return [];
    }
  },

  async saveLabors(labors: Labor[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LABORS, JSON.stringify(labors));
    } catch (error) {
      console.error('Error saving labors:', error);
    }
  },

  async addLabor(labor: Labor): Promise<void> {
    const labors = await this.getLabors();
    labors.push(labor);
    await this.saveLabors(labors);
  },

  async updateLabor(updatedLabor: Labor): Promise<void> {
    const labors = await this.getLabors();
    const index = labors.findIndex(labor => labor.id === updatedLabor.id);
    if (index !== -1) {
      labors[index] = updatedLabor;
      await this.saveLabors(labors);
    }
  },

  async deleteLabor(laborId: string): Promise<void> {
    const labors = await this.getLabors();
    const filteredLabors = labors.filter(labor => labor.id !== laborId);
    await this.saveLabors(filteredLabors);
  },

  // Attendance operations
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting attendance:', error);
      return [];
    }
  },

  async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  },

  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const records = await this.getAttendanceRecords();
    // Remove existing record for same labor and date
    const filteredRecords = records.filter(
      r => !(r.laborId === record.laborId && r.date === record.date)
    );
    filteredRecords.push(record);
    await this.saveAttendanceRecords(filteredRecords);
  },

  // Payment operations
  async getPaymentRecords(): Promise<PaymentRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting payments:', error);
      return [];
    }
  },

  async savePaymentRecords(payments: PaymentRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (error) {
      console.error('Error saving payments:', error);
    }
  },

  async addPaymentRecord(payment: PaymentRecord): Promise<void> {
    const payments = await this.getPaymentRecords();
    payments.push(payment);
    await this.savePaymentRecords(payments);
  },

  async updatePaymentRecord(updatedPayment: PaymentRecord): Promise<void> {
    const payments = await this.getPaymentRecords();
    const index = payments.findIndex(payment => payment.id === updatedPayment.id);
    if (index !== -1) {
      payments[index] = updatedPayment;
      await this.savePaymentRecords(payments);
    }
  },

  async deletePaymentRecord(paymentId: string): Promise<void> {
    const payments = await this.getPaymentRecords();
    const filteredPayments = payments.filter(payment => payment.id !== paymentId);
    await this.savePaymentRecords(filteredPayments);
  },

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { 
        language: 'en', 
        theme: 'light', 
        currency: 'USD',
        hasCompletedOnboarding: false
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { 
        language: 'en', 
        theme: 'light', 
        currency: 'USD',
        hasCompletedOnboarding: false
      };
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Backup and restore
  async exportAllData(): Promise<string> {
    try {
      const [labors, attendance, payments, settings] = await Promise.all([
        this.getLabors(),
        this.getAttendanceRecords(),
        this.getPaymentRecords(),
        this.getSettings(),
      ]);

      const backupData = {
        labors,
        attendance,
        payments,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  },

  async importAllData(jsonData: string): Promise<void> {
    try {
      const backupData = JSON.parse(jsonData);
      
      if (backupData.labors) await this.saveLabors(backupData.labors);
      if (backupData.attendance) await this.saveAttendanceRecords(backupData.attendance);
      if (backupData.payments) await this.savePaymentRecords(backupData.payments);
      if (backupData.settings) await this.saveSettings(backupData.settings);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  },
};