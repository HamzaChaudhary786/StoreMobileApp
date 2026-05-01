import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, Layers, Plus, X, Search, Package, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories().then(() => setRefreshing(false));
  };

  const handleCreate = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/categories', form);
      Alert.alert('Success', 'Category created successfully! 📁');
      setModalVisible(false);
      setForm({ name: '', description: '' });
      fetchCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color={Colors.dark.amber} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.amber} />
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.categoryCard}>
              <View style={styles.iconContainer}>
                <Layers size={24} color={Colors.dark.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <View style={styles.statsRow}>
                  <Package size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                  <Text style={styles.statsText}>{item._count?.products || 0} Products</Text>
                </View>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Layers size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
                placeholder="e.g. Beverages"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                value={form.description}
                onChangeText={(val) => setForm({ ...form, description: val })}
                placeholder="Brief description of this category..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.saveText}>Create Category</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#151718',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#fff',
    fontSize: 14,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151718',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 50,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 15,
  },
  saveButton: {
    height: 54,
    backgroundColor: Colors.dark.amber,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '800',
  },
});
