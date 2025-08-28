import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Labor, AttendanceRecord, PaymentRecord, DashboardStats, AppSettings } from '@/types';
import { StorageUtils } from '@/utils/storage';
import { CalculationUtils } from '@/utils/calculations';

interface DataContextType {
  labors: Labor[];
  attendanceRecords: AttendanceRecord[];
  paymentRecords: PaymentRecord[];
  dashboardStats: DashboardStats;
  settings: AppSettings;
  refreshData: () => Promise<void>;
  addLabor: (labor: Omit<Labor, 'id' | 'createdAt'>) => Promise<void>;
  updateLabor: (id: string, updates: Partial<Labor>) => Promise<void>;
  deleteLabor: (id: string) => Promise<void>;
  markAttendance: (laborId: string, date: string, status: 'present' | 'absent' | 'half') => Promise<void>;
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  exportData: () => Promise<void>;
  importData: (jsonData: string) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [labors, setLabors] = useState<Labor[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ 
    language: 'en', 
    theme: 'light', 
    currency: 'INR',
    hasCompletedOnboarding: false
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalLabors: 0,
    presentToday: 0,
    absentToday: 0,
    halfDayToday: 0,
    totalPendingAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [laborData, attendanceData, paymentData, settingsData] = await Promise.all([
        StorageUtils.getLabors(),
        StorageUtils.getAttendanceRecords(),
        StorageUtils.getPaymentRecords(),
        StorageUtils.getSettings(),
      ]);

      setLabors(laborData);
      setAttendanceRecords(attendanceData);
      setPaymentRecords(paymentData);
      setSettings(settingsData);

      const stats = CalculationUtils.calculateDashboardStats(laborData, attendanceData, paymentData);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addLabor = async (laborData: Omit<Labor, 'id' | 'createdAt'>) => {
    const newLabor: Labor = {
      ...laborData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await StorageUtils.addLabor(newLabor);
    await refreshData();
  };

  const updateLabor = async (id: string, updates: Partial<Labor>) => {
    const labor = labors.find(l => l.id === id);
    if (labor) {
      const updatedLabor = { ...labor, ...updates };
      await StorageUtils.updateLabor(updatedLabor);
      await refreshData();
    }
  };

  const deleteLabor = async (id: string) => {
    await StorageUtils.deleteLabor(id);
    await refreshData();
  };

  const markAttendance = async (laborId: string, date: string, status: 'present' | 'absent' | 'half') => {
    const labor = labors.find(l => l.id === laborId);
    if (labor) {
      const wage = CalculationUtils.calculateWage(labor.dailyWage, status);
      const attendanceRecord: AttendanceRecord = {
        id: generateId(),
        laborId,
        date,
        status,
        wage,
        createdAt: new Date().toISOString(),
      };
      await StorageUtils.addAttendanceRecord(attendanceRecord);
      await refreshData();
    }
  };

  const addPayment = async (paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>) => {
    const payment: PaymentRecord = {
      ...paymentData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await StorageUtils.addPaymentRecord(payment);
    await refreshData();
  };

  const updatePayment = async (id: string, updates: Partial<PaymentRecord>) => {
    const payment = paymentRecords.find(p => p.id === id);
    if (payment) {
      const updatedPayment = { ...payment, ...updates };
      await StorageUtils.updatePaymentRecord(updatedPayment);
      await refreshData();
    }
  };

  const deletePayment = async (paymentId: string) => {
    await StorageUtils.deletePaymentRecord(paymentId);
    await refreshData();
  };

  const updateSettings = async (newSettings: AppSettings) => {
    await StorageUtils.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const exportData = async () => {
    try {
      const backupData = await StorageUtils.exportAllData();
      // In a real implementation, you'd use expo-sharing to share the file
      console.log('Backup data ready for export');
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  const importData = async (jsonData: string) => {
    try {
      await StorageUtils.importAllData(jsonData);
      await refreshData();
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        labors,
        attendanceRecords,
        paymentRecords,
        dashboardStats,
        settings,
        refreshData,
        addLabor,
        updateLabor,
        deleteLabor,
        markAttendance,
        addPayment,
        updatePayment,
        deletePayment,
        updateSettings,
        exportData,
        importData,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}