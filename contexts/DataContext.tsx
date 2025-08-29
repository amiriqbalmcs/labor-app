import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Labor, AttendanceRecord, PaymentRecord, DashboardStats, AppSettings, Workplace } from '@/types';
import { StorageUtils } from '@/utils/storage';
import { CalculationUtils } from '@/utils/calculations';

interface DataContextType {
  workplaces: Workplace[];
  activeWorkplace: Workplace | null;
  labors: Labor[];
  attendanceRecords: AttendanceRecord[];
  paymentRecords: PaymentRecord[];
  dashboardStats: DashboardStats;
  settings: AppSettings;
  refreshData: () => Promise<void>;
  addWorkplace: (workplace: Omit<Workplace, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkplace: (id: string, updates: Partial<Workplace>) => Promise<void>;
  deleteWorkplace: (id: string) => Promise<void>;
  setActiveWorkplace: (workplaceId: string) => Promise<void>;
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
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [activeWorkplace, setActiveWorkplaceState] = useState<Workplace | null>(null);
  const [labors, setLabors] = useState<Labor[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ 
    language: 'en', 
    theme: 'light', 
    currency: 'USD',
    hasCompletedOnboarding: false,
    activeWorkplaceId: undefined
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
      const [workplaceData, laborData, attendanceData, paymentData, settingsData] = await Promise.all([
        StorageUtils.getWorkplaces(),
        StorageUtils.getLabors(),
        StorageUtils.getAttendanceRecords(),
        StorageUtils.getPaymentRecords(),
        StorageUtils.getSettings(),
      ]);

      setWorkplaces(workplaceData);
      setLabors(laborData);
      setAttendanceRecords(attendanceData);
      setPaymentRecords(paymentData);
      setSettings(settingsData);

      // Set active workplace
      let currentWorkplace = null;
      if (settingsData.activeWorkplaceId) {
        currentWorkplace = workplaceData.find(w => w.id === settingsData.activeWorkplaceId) || null;
      }
      if (!currentWorkplace && workplaceData.length > 0) {
        currentWorkplace = workplaceData[0];
        await updateSettings({ ...settingsData, activeWorkplaceId: currentWorkplace.id });
      }
      setActiveWorkplaceState(currentWorkplace);

      // Filter data by active workplace
      const activeWorkplaceId = currentWorkplace?.id;
      const filteredLabors = activeWorkplaceId ? laborData.filter(l => l.workplaceId === activeWorkplaceId) : [];
      const filteredAttendance = activeWorkplaceId ? attendanceData.filter(a => a.workplaceId === activeWorkplaceId) : [];
      const filteredPayments = activeWorkplaceId ? paymentData.filter(p => p.workplaceId === activeWorkplaceId) : [];

      const stats = CalculationUtils.calculateDashboardStats(filteredLabors, filteredAttendance, filteredPayments);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addWorkplace = async (workplaceData: Omit<Workplace, 'id' | 'createdAt'>) => {
    const newWorkplace: Workplace = {
      ...workplaceData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    await StorageUtils.addWorkplace(newWorkplace);
    
    // Set as active workplace if it's the first one
    if (workplaces.length === 0) {
      await updateSettings({ ...settings, activeWorkplaceId: newWorkplace.id });
    }
    
    await refreshData();
  };

  const updateWorkplace = async (id: string, updates: Partial<Workplace>) => {
    const workplace = workplaces.find(w => w.id === id);
    if (workplace) {
      const updatedWorkplace = { ...workplace, ...updates };
      await StorageUtils.updateWorkplace(updatedWorkplace);
      await refreshData();
    }
  };

  const deleteWorkplace = async (id: string) => {
    await StorageUtils.deleteWorkplace(id);
    // If deleting active workplace, switch to another one
    if (settings.activeWorkplaceId === id) {
      const remainingWorkplaces = workplaces.filter(w => w.id !== id);
      const newActiveId = remainingWorkplaces.length > 0 ? remainingWorkplaces[0].id : undefined;
      await updateSettings({ ...settings, activeWorkplaceId: newActiveId });
    }
    await refreshData();
  };

  const setActiveWorkplace = async (workplaceId: string) => {
    await updateSettings({ ...settings, activeWorkplaceId: workplaceId });
    await refreshData();
  };

  const addLabor = async (laborData: Omit<Labor, 'id' | 'createdAt'>) => {
    if (!activeWorkplace) {
      throw new Error('No active workplace selected');
    }

    const newLabor: Labor = {
      ...laborData,
      id: generateId(),
      workplaceId: activeWorkplace.id,
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
    if (!activeWorkplace) {
      throw new Error('No active workplace selected');
    }

    const labor = labors.find(l => l.id === laborId);
    if (labor) {
      const wage = CalculationUtils.calculateWage(labor.dailyWage, status);
      const attendanceRecord: AttendanceRecord = {
        id: generateId(),
        workplaceId: activeWorkplace.id,
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
    if (!activeWorkplace) {
      throw new Error('No active workplace selected');
    }

    const payment: PaymentRecord = {
      ...paymentData,
      id: generateId(),
      workplaceId: activeWorkplace.id,
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
        workplaces,
        activeWorkplace,
        labors,
        attendanceRecords,
        paymentRecords,
        dashboardStats,
        settings,
        refreshData,
        addWorkplace,
        updateWorkplace,
        deleteWorkplace,
        setActiveWorkplace,
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