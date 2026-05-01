import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, RefreshControl, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { Search, User, Phone, CreditCard, Plus, X, UserPlus, TrendingDown, Users, AlertCircle, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCustomers().then(() => setRefreshing(false));
  }, []);

  const handleAddCustomer = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/customers', form);
      Alert.alert('Success', 'Customer added successfully! 👤');
      setModalVisible(false);
      setForm({ name: '', phone: '', address: '' });
      fetchCustomers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c: any) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const activeDebtors = customers.filter(c => (c.currentBalance || 0) > 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={18} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <UserPlus size={24} color={Colors.dark.amber} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <LinearGradient 
            colors={['#f43f5e', '#e11d48']} 
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TrendingDown size={20} color="#fff" />
            <View>
              <Text style={styles.statValue}>₨{totalOutstanding.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </View>
          </LinearGradient>

          <LinearGradient 
            colors={['#f59e0b', '#d97706']} 
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Users size={20} color="#fff" />
            <View>
              <Text style={styles.statValue}>{activeDebtors}</Text>
              <Text style={styles.statLabel}>Active Debtors</Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item: { id: any; }) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity 
            style={styles.customerCard}
            onPress={() => router.push(`/customer/${item?.id}` as any)}
          >
            <View style={styles.avatarContainer}>
              <User size={24} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{item.name}</Text>
              <View style={styles.infoRow}>
                <Phone size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 5 }} />
                <Text style={styles.infoText}>{item.phone}</Text>
              </View>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Udhar Balance</Text>
              <Text style={[styles.balanceValue, (item.currentBalance || 0) > 0 && { color: Colors.dark.rose }]}>
                ₨{(item.currentBalance || 0).toLocaleString()}
              </Text>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.1)" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={60} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(val: any) => setForm({ ...form, name: val })}
                placeholder="e.g. John Doe"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.phone}
                onChangeText={(val: any) => setForm({ ...form, phone: val })}
                placeholder="e.g. 03001234567"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={form.address}
                onChangeText={(val: any) => setForm({ ...form, address: val })}
                placeholder="Street address, City"
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleAddCustomer}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.saveText}>Save Customer</Text>}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#151718',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 25,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    gap: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    textTransform: 'uppercase',
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
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
});
