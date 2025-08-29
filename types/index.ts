export interface Workplace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Labor {
  id: string;
  workplaceId: string;
  name: string;
  phone: string;
  dailyWage: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  workplaceId: string;
  laborId: string;
  date: string;
  status: 'present' | 'absent' | 'half';
  wage: number;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  workplaceId: string;
  laborId: string;
  amount: number;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'partial';
  notes?: string;
  createdAt: string;
}

export interface LaborSummary {
  labor: Labor;
  totalEarned: number;
  totalPaid: number;
  pendingBalance: number;
  totalDaysWorked: number;
  totalDaysPresent: number;
  totalDaysHalf: number;
  totalDaysAbsent: number;
}

export interface DashboardStats {
  totalLabors: number;
  presentToday: number;
  absentToday: number;
  halfDayToday: number;
  totalPendingAmount: number;
}

export interface AppSettings {
  language: 'en' | 'ur' | 'hi';
  theme: 'light' | 'dark';
  currency: 'PKR'| 'INR' | 'USD' | 'EUR' | 'GBP';
  hasCompletedOnboarding: boolean;
  activeWorkplaceId?: string;
}

export interface ReportFilters {
  period: 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}