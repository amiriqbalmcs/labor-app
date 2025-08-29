import { Labor, AttendanceRecord, PaymentRecord, LaborSummary, DashboardStats } from '@/types';

export const CalculationUtils = {
  calculateWage(dailyWage: number, status: 'present' | 'absent' | 'half'): number {
    switch (status) {
      case 'present':
        return dailyWage;
      case 'half':
        return dailyWage / 2;
      case 'absent':
        return 0;
      default:
        return 0;
    }
  },

  calculateLaborSummary(
    labor: Labor,
    attendanceRecords: AttendanceRecord[],
    paymentRecords: PaymentRecord[]
  ): LaborSummary {
    const laborAttendance = attendanceRecords.filter(record => record.laborId === labor.id);
    const laborPayments = paymentRecords.filter(record => record.laborId === labor.id);

    const totalEarned = laborAttendance.reduce((sum, record) => sum + record.wage, 0);
    const totalPaid = laborPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingBalance = totalEarned - totalPaid;

    const totalDaysWorked = laborAttendance.length;
    const totalDaysPresent = laborAttendance.filter(record => record.status === 'present').length;
    const totalDaysHalf = laborAttendance.filter(record => record.status === 'half').length;
    const totalDaysAbsent = laborAttendance.filter(record => record.status === 'absent').length;

    return {
      labor,
      totalEarned,
      totalPaid,
      pendingBalance,
      totalDaysWorked,
      totalDaysPresent,
      totalDaysHalf,
      totalDaysAbsent,
    };
  },

  calculateDashboardStats(
    labors: Labor[],
    attendanceRecords: AttendanceRecord[],
    paymentRecords: PaymentRecord[]
  ): DashboardStats {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(record => record.date === today);

    const presentToday = todayAttendance.filter(record => record.status === 'present').length;
    const absentToday = todayAttendance.filter(record => record.status === 'absent').length;
    const halfDayToday = todayAttendance.filter(record => record.status === 'half').length;

    let totalPendingAmount = 0;
    labors.forEach(labor => {
      const summary = this.calculateLaborSummary(labor, attendanceRecords, paymentRecords);
      totalPendingAmount += summary.pendingBalance;
    });

    return {
      totalLabors: labors.length,
      presentToday,
      absentToday,
      halfDayToday,
      totalPendingAmount,
    };
  },

  formatCurrency(amount: number, currency: 'PKR' | 'INR' | 'USD' | 'EUR' | 'GBP' = 'USD'): string {
    const symbols = {
      PKR: 'Rs ',
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    
    const locales = {
      PKR: 'en-PK',
      INR: 'en-IN',
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB'
    };
    
    return `${symbols[currency]}${amount.toLocaleString(locales[currency])}`;
  },

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  },
};