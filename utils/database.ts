import * as SQLite from 'expo-sqlite';
import { Labor, AttendanceRecord, PaymentRecord, AppSettings, Workplace } from '@/types';

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('laborManagement.db');
      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS workplaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS labors (
        id TEXT PRIMARY KEY,
        workplaceId TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        dailyWage REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (workplaceId) REFERENCES workplaces (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        workplaceId TEXT NOT NULL,
        laborId TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half')),
        wage REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (workplaceId) REFERENCES workplaces (id) ON DELETE CASCADE,
        FOREIGN KEY (laborId) REFERENCES labors (id) ON DELETE CASCADE,
        UNIQUE(laborId, date)
      );

      CREATE TABLE IF NOT EXISTS payment_records (
        id TEXT PRIMARY KEY,
        workplaceId TEXT NOT NULL,
        laborId TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'partial')),
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (workplaceId) REFERENCES workplaces (id) ON DELETE CASCADE,
        FOREIGN KEY (laborId) REFERENCES labors (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        language TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'light',
        currency TEXT DEFAULT 'USD',
        hasCompletedOnboarding INTEGER DEFAULT 0,
        activeWorkplaceId TEXT,
        FOREIGN KEY (activeWorkplaceId) REFERENCES workplaces (id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_labors_workplace ON labors(workplaceId);
      CREATE INDEX IF NOT EXISTS idx_attendance_workplace ON attendance_records(workplaceId);
      CREATE INDEX IF NOT EXISTS idx_attendance_labor ON attendance_records(laborId);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
      CREATE INDEX IF NOT EXISTS idx_payments_workplace ON payment_records(workplaceId);
      CREATE INDEX IF NOT EXISTS idx_payments_labor ON payment_records(laborId);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payment_records(date);
    `);

    // Insert default settings if not exists
    await this.db.runAsync(`
      INSERT OR IGNORE INTO app_settings (id, language, theme, currency, hasCompletedOnboarding)
      VALUES (1, 'en', 'light', 'USD', 0)
    `);
  }

  // Workplace operations
  async getWorkplaces(): Promise<Workplace[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM workplaces ORDER BY createdAt DESC
    `);
    
    return result.map(row => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string || undefined,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt as string,
    }));
  }

  async addWorkplace(workplace: Workplace): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO workplaces (id, name, description, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `, [workplace.id, workplace.name, workplace.description || null, workplace.isActive ? 1 : 0, workplace.createdAt]);
  }

  async updateWorkplace(workplace: Workplace): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE workplaces 
      SET name = ?, description = ?, isActive = ?
      WHERE id = ?
    `, [workplace.name, workplace.description || null, workplace.isActive ? 1 : 0, workplace.id]);
  }

  async deleteWorkplace(workplaceId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Foreign key constraints will handle cascading deletes
    await this.db.runAsync('DELETE FROM workplaces WHERE id = ?', [workplaceId]);
  }

  // Labor operations
  async getLabors(): Promise<Labor[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM labors ORDER BY createdAt DESC
    `);
    
    return result.map(row => ({
      id: row.id as string,
      workplaceId: row.workplaceId as string,
      name: row.name as string,
      phone: row.phone as string,
      dailyWage: row.dailyWage as number,
      createdAt: row.createdAt as string,
    }));
  }

  async addLabor(labor: Labor): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO labors (id, workplaceId, name, phone, dailyWage, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [labor.id, labor.workplaceId, labor.name, labor.phone, labor.dailyWage, labor.createdAt]);
  }

  async updateLabor(labor: Labor): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE labors 
      SET name = ?, phone = ?, dailyWage = ?
      WHERE id = ?
    `, [labor.name, labor.phone, labor.dailyWage, labor.id]);
  }

  async deleteLabor(laborId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Foreign key constraints will handle cascading deletes
    await this.db.runAsync('DELETE FROM labors WHERE id = ?', [laborId]);
  }

  // Attendance operations
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM attendance_records ORDER BY date DESC, createdAt DESC
    `);
    
    return result.map(row => ({
      id: row.id as string,
      workplaceId: row.workplaceId as string,
      laborId: row.laborId as string,
      date: row.date as string,
      status: row.status as 'present' | 'absent' | 'half',
      wage: row.wage as number,
      createdAt: row.createdAt as string,
    }));
  }

  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Replace existing record for same labor and date
    await this.db.runAsync(`
      INSERT OR REPLACE INTO attendance_records 
      (id, workplaceId, laborId, date, status, wage, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.workplaceId, record.laborId, record.date, record.status, record.wage, record.createdAt]);
  }

  // Payment operations
  async getPaymentRecords(): Promise<PaymentRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM payment_records ORDER BY date DESC, createdAt DESC
    `);
    
    return result.map(row => ({
      id: row.id as string,
      workplaceId: row.workplaceId as string,
      laborId: row.laborId as string,
      amount: row.amount as number,
      date: row.date as string,
      type: row.type as 'daily' | 'weekly' | 'monthly' | 'partial',
      notes: row.notes as string || undefined,
      createdAt: row.createdAt as string,
    }));
  }

  async addPaymentRecord(payment: PaymentRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO payment_records 
      (id, workplaceId, laborId, amount, date, type, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [payment.id, payment.workplaceId, payment.laborId, payment.amount, payment.date, payment.type, payment.notes || null, payment.createdAt]);
  }

  async updatePaymentRecord(payment: PaymentRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE payment_records 
      SET amount = ?, date = ?, type = ?, notes = ?
      WHERE id = ?
    `, [payment.amount, payment.date, payment.type, payment.notes || null, payment.id]);
  }

  async deletePaymentRecord(paymentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM payment_records WHERE id = ?', [paymentId]);
  }

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(`
      SELECT * FROM app_settings WHERE id = 1
    `);
    
    if (result) {
      return {
        language: result.language as 'en' | 'ur' | 'hi',
        theme: result.theme as 'light' | 'dark',
        currency: result.currency as 'PKR' | 'INR' | 'USD' | 'EUR' | 'GBP',
        hasCompletedOnboarding: Boolean(result.hasCompletedOnboarding),
        activeWorkplaceId: result.activeWorkplaceId as string || undefined,
      };
    }
    
    return {
      language: 'en',
      theme: 'light',
      currency: 'USD',
      hasCompletedOnboarding: false,
    };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE app_settings 
      SET language = ?, theme = ?, currency = ?, hasCompletedOnboarding = ?, activeWorkplaceId = ?
      WHERE id = 1
    `, [
      settings.language,
      settings.theme,
      settings.currency,
      settings.hasCompletedOnboarding ? 1 : 0,
      settings.activeWorkplaceId || null
    ]);
  }

  // Export and import operations
  async exportAllData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [workplaces, labors, attendance, payments, settings] = await Promise.all([
      this.getWorkplaces(),
      this.getLabors(),
      this.getAttendanceRecords(),
      this.getPaymentRecords(),
      this.getSettings(),
    ]);

    const backupData = {
      workplaces,
      labors,
      attendance,
      payments,
      settings,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };

    return JSON.stringify(backupData, null, 2);
  }

  async importAllData(jsonData: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const backupData = JSON.parse(jsonData);
    
    // Start transaction
    await this.db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Clear existing data (except settings)
      await this.db.runAsync('DELETE FROM payment_records');
      await this.db.runAsync('DELETE FROM attendance_records');
      await this.db.runAsync('DELETE FROM labors');
      await this.db.runAsync('DELETE FROM workplaces');
      
      // Import workplaces
      if (backupData.workplaces) {
        for (const workplace of backupData.workplaces) {
          await this.addWorkplace(workplace);
        }
      }
      
      // Import labors
      if (backupData.labors) {
        for (const labor of backupData.labors) {
          await this.addLabor(labor);
        }
      }
      
      // Import attendance
      if (backupData.attendance) {
        for (const record of backupData.attendance) {
          await this.addAttendanceRecord(record);
        }
      }
      
      // Import payments
      if (backupData.payments) {
        for (const payment of backupData.payments) {
          await this.addPaymentRecord(payment);
        }
      }
      
      // Import settings
      if (backupData.settings) {
        await this.saveSettings(backupData.settings);
      }
      
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  async resetAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync(`
      BEGIN TRANSACTION;
      DELETE FROM payment_records;
      DELETE FROM attendance_records;
      DELETE FROM labors;
      DELETE FROM workplaces;
      UPDATE app_settings SET 
        hasCompletedOnboarding = 0,
        activeWorkplaceId = NULL
      WHERE id = 1;
      COMMIT;
    `);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const DatabaseUtils = new DatabaseManager();