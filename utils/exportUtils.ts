import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Labor, AttendanceRecord, PaymentRecord, ReportFilters } from '@/types';
import { CalculationUtils } from './calculations';

export const ExportUtils = {
  async generatePDFContent(
    labors: Labor[],
    attendanceRecords: AttendanceRecord[],
    paymentRecords: PaymentRecord[],
    filters?: ReportFilters
  ): Promise<string> {
    const now = new Date();
    let filteredAttendance = attendanceRecords;
    let filteredPayments = paymentRecords;
    let reportTitle = 'Complete Labor Report';

    if (filters) {
      let startDate: Date;
      let endDate = now;

      switch (filters.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          reportTitle = 'Weekly Labor Report';
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          reportTitle = 'Monthly Labor Report';
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate);
            endDate = new Date(filters.endDate);
            reportTitle = 'Custom Period Labor Report';
          } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          }
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];

      filteredAttendance = attendanceRecords.filter(
        record => record.date >= startDateString && record.date <= endDateString
      );
      
      filteredPayments = paymentRecords.filter(
        record => record.date >= startDateString && record.date <= endDateString
      );
    }

    // Calculate totals
    const totalEarned = filteredAttendance.reduce((sum, record) => sum + record.wage, 0);
    const totalPaid = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPending = labors.reduce((sum, labor) => {
      const summary = CalculationUtils.calculateLaborSummary(labor, attendanceRecords, paymentRecords);
      return sum + summary.pendingBalance;
    }, 0);

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .title { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 14px; }
          .summary { display: flex; justify-content: space-around; margin: 20px 0; }
          .summary-item { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .summary-value { font-size: 20px; font-weight: bold; color: #2563eb; }
          .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .labor-item { margin: 15px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .labor-name { font-size: 16px; font-weight: bold; color: #1f2937; }
          .labor-details { margin: 5px 0; font-size: 14px; color: #666; }
          .labor-summary { display: flex; justify-content: space-between; margin-top: 10px; }
          .labor-stat { text-align: center; }
          .labor-stat-value { font-weight: bold; color: #2563eb; }
          .labor-stat-label { font-size: 12px; color: #666; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${reportTitle}</div>
          <div class="subtitle">Generated on ${CalculationUtils.formatDate(now.toISOString().split('T')[0])}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-value">${CalculationUtils.formatCurrency(totalEarned)}</div>
            <div class="summary-label">Total Earned</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${CalculationUtils.formatCurrency(totalPaid)}</div>
            <div class="summary-label">Total Paid</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${CalculationUtils.formatCurrency(totalPending)}</div>
            <div class="summary-label">Total Pending</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Labor Details</div>
          ${labors.map(labor => {
            const summary = CalculationUtils.calculateLaborSummary(labor, attendanceRecords, paymentRecords);
            return `
              <div class="labor-item">
                <div class="labor-name">${labor.name}</div>
                <div class="labor-details">Phone: ${labor.phone}</div>
                <div class="labor-details">Daily Wage: ${CalculationUtils.formatCurrency(labor.dailyWage)}</div>
                <div class="labor-summary">
                  <div class="labor-stat">
                    <div class="labor-stat-value">${CalculationUtils.formatCurrency(summary.totalEarned)}</div>
                    <div class="labor-stat-label">Earned</div>
                  </div>
                  <div class="labor-stat">
                    <div class="labor-stat-value">${CalculationUtils.formatCurrency(summary.totalPaid)}</div>
                    <div class="labor-stat-label">Paid</div>
                  </div>
                  <div class="labor-stat">
                    <div class="labor-stat-value">${CalculationUtils.formatCurrency(summary.pendingBalance)}</div>
                    <div class="labor-stat-label">Pending</div>
                  </div>
                  <div class="labor-stat">
                    <div class="labor-stat-value">${summary.totalDaysWorked}</div>
                    <div class="labor-stat-label">Days Worked</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          <div>Labor Management System</div>
          <div>Report generated automatically</div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  },

  async exportToPDF(
    labors: Labor[],
    attendanceRecords: AttendanceRecord[],
    paymentRecords: PaymentRecord[],
    filters?: ReportFilters
  ): Promise<void> {
    try {
      const htmlContent = await this.generatePDFContent(labors, attendanceRecords, paymentRecords, filters);
      
      const fileName = `labor_report_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Export Labor Report',
        });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export report');
    }
  },

  async exportBackupData(
    labors: Labor[],
    attendanceRecords: AttendanceRecord[],
    paymentRecords: PaymentRecord[]
  ): Promise<void> {
    try {
      const backupData = {
        labors,
        attendanceRecords,
        paymentRecords,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const jsonContent = JSON.stringify(backupData, null, 2);
      const fileName = `labor_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Backup Data',
        });
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw new Error('Failed to export backup');
    }
  },
};