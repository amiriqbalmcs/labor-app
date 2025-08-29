import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, ChevronDown, Plus, X, Edit3, Trash2 } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useTranslation } from '@/utils/translations';
import { Workplace } from '@/types';

interface WorkplaceSelectorProps {
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export function WorkplaceSelector({ theme = 'light', compact = false }: WorkplaceSelectorProps) {
  const { 
    workplaces, 
    activeWorkplace, 
    setActiveWorkplace, 
    addWorkplace, 
    updateWorkplace, 
    deleteWorkplace,
    settings 
  } = useData();
  const { t } = useTranslation(settings.language);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<Workplace | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleAddWorkplace = () => {
    setEditingWorkplace(null);
    setFormData({ name: '', description: '' });
    setAddModalVisible(true);
  };

  const handleEditWorkplace = (workplace: Workplace) => {
    setEditingWorkplace(workplace);
    setFormData({
      name: workplace.name,
      description: workplace.description || '',
    });
    setAddModalVisible(true);
  };

  const handleSaveWorkplace = async () => {
    if (!formData.name.trim()) {
      Alert.alert(t('error'), 'Please enter workplace name');
      return;
    }

    try {
      if (editingWorkplace) {
        await updateWorkplace(editingWorkplace.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
      } else {
        await addWorkplace({
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: true,
        });
      }
      setAddModalVisible(false);
      setModalVisible(false);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save workplace');
    }
  };

  const handleDeleteWorkplace = (workplace: Workplace) => {
    if (workplaces.length === 1) {
      Alert.alert(t('error'), 'Cannot delete the last workplace');
      return;
    }

    Alert.alert(
      'Delete Workplace',
      `Are you sure you want to delete "${workplace.name}"? This will also delete all associated data.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteWorkplace(workplace.id),
        },
      ]
    );
  };

  if (workplaces.length === 0) {
    return null;
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactSelector, theme === 'dark' && styles.darkCompactSelector]}
          onPress={() => setModalVisible(true)}
        >
          <Building2 size={16} color={theme === 'dark' ? '#60a5fa' : '#2563eb'} />
          <Text style={[styles.compactSelectorText, theme === 'dark' && styles.darkCompactSelectorText]} numberOfLines={1}>
            {truncateText(activeWorkplace?.name || 'Select Workplace', 20)}
          </Text>
          <ChevronDown size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>

        {/* Workplace Selection Modal */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.modalContainer, theme === 'dark' && styles.darkModalContainer]}>
            <View style={[styles.modalHeader, theme === 'dark' && { borderBottomColor: '#374151' }]}>
              <Text style={[styles.modalTitle, theme === 'dark' && styles.darkText]}>Select Workplace</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {workplaces.map((workplace) => (
                <View key={workplace.id} style={[styles.workplaceItem, theme === 'dark' && styles.darkWorkplaceItem]}>
                  <TouchableOpacity
                    style={[
                      styles.workplaceButton,
                      activeWorkplace?.id === workplace.id && styles.activeWorkplaceButton,
                    ]}
                    onPress={() => {
                      setActiveWorkplace(workplace.id);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.workplaceInfo}>
                      <Text style={[
                        styles.workplaceName,
                        theme === 'dark' && styles.darkText,
                        activeWorkplace?.id === workplace.id && styles.activeWorkplaceName,
                      ]}>
                        {workplace.name}
                      </Text>
                      {workplace.description && (
                        <Text style={[
                          styles.workplaceDescription,
                          theme === 'dark' && styles.darkSubtext,
                          activeWorkplace?.id === workplace.id && styles.activeWorkplaceDescription,
                        ]}>
                          {workplace.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.workplaceActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, theme === 'dark' && styles.darkActionButton]}
                      onPress={() => handleEditWorkplace(workplace)}
                    >
                      <Edit3 size={16} color="#2563eb" />
                    </TouchableOpacity>
                    {workplaces.length > 1 && (
                      <TouchableOpacity
                        style={[styles.actionButton, theme === 'dark' && styles.darkActionButton]}
                        onPress={() => handleDeleteWorkplace(workplace)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addWorkplaceButton, theme === 'dark' && styles.darkAddWorkplaceButton]}
                onPress={handleAddWorkplace}
              >
                <Plus size={20} color="#2563eb" />
                <Text style={[styles.addWorkplaceText, theme === 'dark' && styles.darkText]}>Add New Workplace</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add/Edit Workplace Modal */}
        <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.modalContainer, theme === 'dark' && styles.darkModalContainer]}>
            <View style={[styles.modalHeader, theme === 'dark' && { borderBottomColor: '#374151' }]}>
              <Text style={[styles.modalTitle, theme === 'dark' && styles.darkText]}>
                {editingWorkplace ? 'Edit Workplace' : 'Add New Workplace'}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, theme === 'dark' && styles.darkText]}>Workplace Name</Text>
                <TextInput
                  style={[styles.input, theme === 'dark' && styles.darkInput]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter workplace name"
                  placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, theme === 'dark' && styles.darkText]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, theme === 'dark' && styles.darkInput]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter workplace description"
                  placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, theme === 'dark' && styles.darkCancelButton]}
                  onPress={() => setAddModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveWorkplace}>
                  <Text style={styles.saveButtonText}>
                    {editingWorkplace ? t('update') : t('add')} Workplace
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  return (
    <>
      <View style={[styles.elegantSelector, theme === 'dark' && styles.darkElegantSelector]}>
        <TouchableOpacity
          style={styles.elegantSelectorButton}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.elegantSelectorContent}>
            <Building2 size={20} color={theme === 'dark' ? '#60a5fa' : '#2563eb'} />
            <View style={styles.elegantSelectorText}>
              <Text style={[styles.elegantWorkplaceName, theme === 'dark' && styles.darkText]} numberOfLines={1}>
                {activeWorkplace?.name || 'Select Workplace'}
              </Text>
              {activeWorkplace?.description && (
                <Text style={[styles.elegantWorkplaceDescription, theme === 'dark' && styles.darkSubtext]} numberOfLines={1}>
                  {activeWorkplace.description}
                </Text>
              )}
            </View>
            <ChevronDown size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Workplace Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, theme === 'dark' && styles.darkModalContainer]}>
          <View style={[styles.modalHeader, theme === 'dark' && { borderBottomColor: '#374151' }]}>
            <Text style={[styles.modalTitle, theme === 'dark' && styles.darkText]}>Select Workplace</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {workplaces.map((workplace) => (
              <View key={workplace.id} style={[styles.workplaceItem, theme === 'dark' && styles.darkWorkplaceItem]}>
                <TouchableOpacity
                  style={[
                    styles.workplaceButton,
                    activeWorkplace?.id === workplace.id && styles.activeWorkplaceButton,
                  ]}
                  onPress={() => {
                    setActiveWorkplace(workplace.id);
                    setModalVisible(false);
                  }}
                >
                  <View style={styles.workplaceInfo}>
                    <Text style={[
                      styles.workplaceName,
                      theme === 'dark' && styles.darkText,
                      activeWorkplace?.id === workplace.id && styles.activeWorkplaceName,
                    ]}>
                      {workplace.name}
                    </Text>
                    {workplace.description && (
                      <Text style={[
                        styles.workplaceDescription,
                        theme === 'dark' && styles.darkSubtext,
                        activeWorkplace?.id === workplace.id && styles.activeWorkplaceDescription,
                      ]}>
                        {workplace.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.workplaceActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, theme === 'dark' && styles.darkActionButton]}
                    onPress={() => handleEditWorkplace(workplace)}
                  >
                    <Edit3 size={16} color="#2563eb" />
                  </TouchableOpacity>
                  {workplaces.length > 1 && (
                    <TouchableOpacity
                      style={[styles.actionButton, theme === 'dark' && styles.darkActionButton]}
                      onPress={() => handleDeleteWorkplace(workplace)}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addWorkplaceButton, theme === 'dark' && styles.darkAddWorkplaceButton]}
              onPress={handleAddWorkplace}
            >
              <Plus size={20} color="#2563eb" />
              <Text style={[styles.addWorkplaceText, theme === 'dark' && styles.darkText]}>Add New Workplace</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add/Edit Workplace Modal */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, theme === 'dark' && styles.darkModalContainer]}>
          <View style={[styles.modalHeader, theme === 'dark' && { borderBottomColor: '#374151' }]}>
            <Text style={[styles.modalTitle, theme === 'dark' && styles.darkText]}>
              {editingWorkplace ? 'Edit Workplace' : 'Add New Workplace'}
            </Text>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <X size={24} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, theme === 'dark' && styles.darkText]}>Workplace Name</Text>
              <TextInput
                style={[styles.input, theme === 'dark' && styles.darkInput]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter workplace name"
                placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, theme === 'dark' && styles.darkText]}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, theme === 'dark' && styles.darkInput]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter workplace description"
                placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, theme === 'dark' && styles.darkCancelButton]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, theme === 'dark' && styles.darkSubtext]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveWorkplace}>
                <Text style={styles.saveButtonText}>
                  {editingWorkplace ? t('update') : t('add')} Workplace
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Compact selector for headers
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 140,
  },
  darkCompactSelector: {
    backgroundColor: '#1e3a8a',
  },
  compactSelectorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 4,
    marginRight: 4,
  },
  darkCompactSelectorText: {
    color: '#60a5fa',
  },

  // Elegant selector for main display
  elegantSelector: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkElegantSelector: {
    backgroundColor: '#1f2937',
  },
  elegantSelectorButton: {
    padding: 16,
  },
  elegantSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elegantSelectorText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  elegantWorkplaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  elegantWorkplaceDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  darkText: {
    color: '#f9fafb',
  },
  darkSubtext: {
    color: '#9ca3af',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkModalContainer: {
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  workplaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 4,
  },
  darkWorkplaceItem: {
    backgroundColor: '#1f2937',
  },
  workplaceButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
  },
  activeWorkplaceButton: {
    backgroundColor: '#2563eb',
  },
  workplaceInfo: {
    flex: 1,
  },
  workplaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activeWorkplaceName: {
    color: '#ffffff',
  },
  workplaceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeWorkplaceDescription: {
    color: '#e5e7eb',
  },
  workplaceActions: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  darkActionButton: {
    backgroundColor: '#374151',
  },
  addWorkplaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  darkAddWorkplaceButton: {
    backgroundColor: '#1f2937',
    borderColor: '#4b5563',
  },
  addWorkplaceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  darkInput: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  darkCancelButton: {
    borderColor: '#4b5563',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});