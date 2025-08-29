import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Palette, 
  Download, 
  Upload, 
  FileText,
  Moon,
  Sun,
  DollarSign
} from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
import { useData } from '@/contexts/DataContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { ExportUtils } from '@/utils/exportUtils';
import { useTranslation } from '@/utils/translations';

export default function SettingsScreen() {
  const { 
    settings, 
    updateSettings, 
    labors, 
    attendanceRecords, 
    paymentRecords, 
    exportData, 
    importData, 
    isLoading 
  } = useData();
  const { t } = useTranslation(settings.language);
  const [exporting, setExporting] = useState(false);

  const handleLanguageChange = (language: 'en' | 'ur' | 'hi') => {
    updateSettings({ ...settings, language });
  };

  const handleCurrencyChange = (currency: 'PKR' | 'INR' | 'USD' | 'EUR' | 'GBP') => {
    updateSettings({ ...settings, currency });
  };

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ ...settings, theme: newTheme });
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      await ExportUtils.exportBackupData(labors, attendanceRecords, paymentRecords);
      Alert.alert(t('success'), t('dataExported'));
    } catch (error) {
      Alert.alert(t('error'), t('exportFailed'));
    } finally {
      setExporting(false);
    }
  };
  
  const handleExportReport = async () => {
    try {
      setExporting(true);
      await ExportUtils.exportToPDF(labors, attendanceRecords, paymentRecords, undefined, settings.currency);
      Alert.alert(t('success'), t('dataExported'));
    } catch (error) {
      Alert.alert(t('error'), t('exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: 'application/json',
      //   copyToCacheDirectory: true,
      // });

      Alert.alert(
        t('restoreData'),
        'This will replace all existing data. Are you sure?',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('restoreData'),
            style: 'destructive',
            onPress: async () => {
              try {
                Alert.alert('Info', 'Import functionality would be implemented here');
              } catch (error) {
                Alert.alert(t('error'), t('importFailed'));
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('error'), 'Failed to select file');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const languageOptions = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  ] as const;

  const currencyOptions = [
    { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
  ] as const;

  return (
    <SafeAreaView style={[styles.container, settings.theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, settings.theme === 'dark' && styles.darkText]}>{t('settings')}</Text>
        <Text style={[styles.subtitle, settings.theme === 'dark' && styles.darkSubtext]}>
          {t('customizeApp')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Language Settings */}
        <Card style={[styles.section, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#2563eb" />
            <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>
              {t('language')}
            </Text>
          </View>
          <View style={styles.languageOptions}>
            {languageOptions.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.languageOption,
                  settings.theme === 'dark' && styles.darkLanguageOption,
                  settings.language === option.code && styles.selectedLanguageOption,
                ]}
                onPress={() => handleLanguageChange(option.code)}
              >
                <Text style={[
                  styles.languageOptionText,
                  settings.theme === 'dark' && styles.darkLanguageOptionText,
                  settings.language === option.code && styles.selectedLanguageOptionText,
                ]}>
                  {option.nativeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Currency Settings */}
        <Card style={[styles.section, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#2563eb" />
            <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>
              {t('currency')}
            </Text>
          </View>
          <View style={styles.languageOptions}>
            {currencyOptions.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.languageOption,
                  settings.theme === 'dark' && styles.darkLanguageOption,
                  settings.currency === option.code && styles.selectedLanguageOption,
                ]}
                onPress={() => handleCurrencyChange(option.code)}
              >
                <Text style={[
                  styles.languageOptionText,
                  settings.theme === 'dark' && styles.darkLanguageOptionText,
                  settings.currency === option.code && styles.selectedLanguageOptionText,
                ]}>
                  {option.symbol} {option.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Theme Settings */}
        <Card style={[styles.section, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.sectionHeader}>
            {settings.theme === 'light' ? (
              <Sun size={20} color="#2563eb" />
            ) : (
              <Moon size={20} color="#2563eb" />
            )}
            <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>
              {t('theme')}
            </Text>
          </View>
          <View style={styles.themeToggle}>
            <Text style={[styles.themeLabel, settings.theme === 'dark' && styles.darkText]}>
              {settings.theme === 'light' ? t('light') : t('dark')}
            </Text>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
              thumbColor={settings.theme === 'dark' ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Data Management */}
        <Card style={[styles.section, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#2563eb" />
            <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>
              {t('dataManagement')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, settings.theme === 'dark' && styles.darkActionButton, exporting && styles.disabledButton]}
            onPress={handleExportData}
            disabled={exporting}
          >
            <Download size={20} color="#16a34a" />
            <Text style={[styles.actionButtonText, settings.theme === 'dark' && styles.darkText]}>
              {exporting ? t('loading') : t('backupData')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, settings.theme === 'dark' && styles.darkActionButton]}
            onPress={handleImportData}
          >
            <Upload size={20} color="#d97706" />
            <Text style={[styles.actionButtonText, settings.theme === 'dark' && styles.darkText]}>{t('restoreData')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, settings.theme === 'dark' && styles.darkActionButton, exporting && styles.disabledButton]}
            onPress={handleExportReport}
            disabled={exporting}
          >
            <FileText size={20} color="#2563eb" />
            <Text style={[styles.actionButtonText, settings.theme === 'dark' && styles.darkText]}>
              {exporting ? t('loading') : t('exportReport')}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* App Information */}
        <Card style={[styles.section, settings.theme === 'dark' && styles.darkCard]}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color="#2563eb" />
            <Text style={[styles.sectionTitle, settings.theme === 'dark' && styles.darkText]}>
              App Information
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, settings.theme === 'dark' && styles.darkText]}>Version</Text>
            <Text style={[styles.infoValue, settings.theme === 'dark' && styles.darkSubtext]}>1.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, settings.theme === 'dark' && styles.darkText]}>{t('totalLabors')}</Text>
            <Text style={[styles.infoValue, settings.theme === 'dark' && styles.darkSubtext]}>{labors.length}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, settings.theme === 'dark' && styles.darkText]}>Total Records</Text>
            <Text style={[styles.infoValue, settings.theme === 'dark' && styles.darkSubtext]}>
              {attendanceRecords.length + paymentRecords.length}
            </Text>
          </View>
        </Card>
      </ScrollView>
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
  darkText: {
    color: '#f9fafb',
  },
  darkSubtext: {
    color: '#9ca3af',
  },
  section: {
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: '#1f2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  darkLanguageOption: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  selectedLanguageOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  darkLanguageOptionText: {
    color: '#d1d5db',
  },
  selectedLanguageOptionText: {
    color: '#ffffff',
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    color: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  darkActionButton: {
    backgroundColor: '#374151',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});