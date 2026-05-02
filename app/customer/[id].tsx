import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, FlatList, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { ChevronLeft, Phone, MapPin, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, DollarSign, Plus, X, MessageSquare, Search, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UdharItem {
  productId: string;
  quantity: number;
  priceAtTime: number;
  unit: string;
  name: string;
}

interface UdharForm {
  items: UdharItem[];
  description: string;
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'payments'>('history');
  
  // Modals
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [udharModalVisible, setUdharModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Udhar Form State
  const [products, setProducts] = useState<any[]>([]);
  const [udharForm, setUdharForm] = useState<UdharForm>({
    items: [{ productId: '', quantity: 1, priceAtTime: 0, unit: 'pcs', name: '' }],
    description: ''
  });

  // Product Picker State
  const [udharModalView, setUdharModalView] = useState<'form' | 'picker'>('form');
  const [productSearch, setProductSearch] = useState('');
  const [currentPickingIndex, setCurrentPickingIndex] = useState<number | null>(null);

  const fetchCustomerData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get('/products')
      ]);
      setCustomer(custRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handlePayment = async () => {
    if (!payAmount || isNaN(Number(payAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/customers/pay', {
        customerId: id,
        amount: Number(payAmount),
        note: payNote
      });
      Alert.alert('Success', 'Payment recorded! ✅');
      setPayModalVisible(false);
      setPayAmount('');
      setPayNote('');
      fetchCustomerData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUdhar = async () => {
    const validItems = udharForm.items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/customers/transaction', {
        customerId: id,
        items: validItems,
        description: udharForm.description
      });
      Alert.alert('Success', 'Udhar entry added! 📦');
      setUdharModalVisible(false);
      setUdharModalView('form');
      setUdharForm({ items: [{ productId: '', quantity: 1, priceAtTime: 0, unit: 'pcs', name: '' }], description: '' });
      fetchCustomerData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateUdharItem = (index: number, field: string, value: any) => {
    const newItems = [...udharForm.items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        name: prod?.name || '',
        priceAtTime: prod?.salePrice || 0,
        unit: prod?.unit || 'pcs'
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setUdharForm({ ...udharForm, items: newItems });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.dark.amber} />
      </View>
    );
  }

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.historyCard} key={item.id}>
      <View style={styles.historyTop}>
        <View style={styles.historyTypeRow}>
          <View style={[styles.statusBadge, { backgroundColor: item.isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)' }]}>
            <Text style={[styles.statusText, { color: item.isPaid ? '#10b981' : '#fb7185' }]}>
              {item.isPaid ? 'PAID' : 'UNPAID'}
            </Text>
          </View>
          <Text style={styles.historyDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '---'}
          </Text>
        </View>
        <Text style={styles.historyAmount}>₨{(item.totalAmount || 0).toFixed(0)}</Text>
      </View>

      {item.items && item.items.length > 0 ? (
        <View style={styles.itemsList}>
          {item.items.map((i: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{i.product?.name || 'Unknown Product'}</Text>
              <Text style={styles.itemDetails}>{i.quantity || 0} {i.product?.unit || 'pcs'} × ₨{i.priceAtTime || 0}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.historyTitle}>{item.description || 'Udhar Purchase'}</Text>
      )}

      {!item.isPaid && (
        <TouchableOpacity 
          style={styles.payTxBtn}
          onPress={() => handlePaySpecificTransaction(item)}
        >
          <Text style={styles.payTxBtnText}>MARK AS PAID</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handlePaySpecificTransaction = (transaction: any) => {
    Alert.alert(
      "Confirm Payment",
      `Mark this transaction of ₨${transaction.totalAmount} as paid? This will decrement the customer's balance.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              await api.post(`/customers/pay-transaction/${transaction.id}`);
              Alert.alert("Success", "Transaction marked as paid!");
              fetchCustomerData();
            } catch (err) {
              Alert.alert("Error", "Failed to process payment");
            }
          } 
        }
      ]
    );
  };

  const renderPayment = ({ item }: { item: any }) => (
    <View style={styles.historyItem} key={item.id}>
      <View style={[styles.historyIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
        <CheckCircle2 size={18} color="#10b981" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{item.note || 'Cash Payment'}</Text>
        <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <Text style={[styles.historyAmount, { color: '#10b981' }]}>+₨{(item.amount || 0).toLocaleString()}</Text>
    </View>
  );

  const udharTotal = udharForm.items.reduce((acc, i) => acc + (i.quantity * i.priceAtTime), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Customer Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <LinearGradient 
          colors={['#1c1c24', '#0c0c14']} 
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.profileTop}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{customer.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.customerNameLarge}>{customer.name}</Text>
              <View style={styles.infoRow}>
                <Phone size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.infoTextLarge}>{customer.phone}</Text>
              </View>
              {customer.address && (
                <View style={styles.infoRow}>
                  <MapPin size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.infoTextLarge}>{customer.address}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.balanceSection}>
            <View>
              <Text style={styles.balanceLabelLarge}>Outstanding Udhar</Text>
              <Text style={[styles.balanceValueLarge, customer.currentBalance > 0 && { color: Colors.dark.rose }]}>
                ₨{customer.currentBalance.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionGridRow}>
            <TouchableOpacity 
              style={[styles.actionBtnExtended, { backgroundColor: 'rgba(244,63,94,0.1)' }]}
              onPress={() => setUdharModalVisible(true)}
            >
              <ArrowUpRight size={18} color={Colors.dark.rose} />
              <Text style={[styles.actionBtnText, { color: Colors.dark.rose }]}>Add Udhar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtnExtended, { backgroundColor: 'rgba(16,185,129,0.1)' }]}
              onPress={() => setPayModalVisible(true)}
            >
              <ArrowDownLeft size={18} color="#10b981" />
              <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Mark Paid</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Udhar History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>Payment Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          {activeTab === 'history' ? (
            customer.udharTransactions?.length > 0 ? (
              customer.udharTransactions.map((item: any) => renderTransaction({ item }))
            ) : (
              <View style={styles.emptyContainer}>
                <MessageSquare size={40} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyText}>No udhar history found</Text>
              </View>
            )
          ) : (
            customer.paymentLogs?.length > 0 ? (
              customer.paymentLogs.map((item: any) => renderPayment({ item }))
            ) : (
              <View style={styles.emptyContainer}>
                <CheckCircle2 size={40} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyText}>No payment logs found</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={payModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Payment</Text>
                <Text style={styles.modalSubTitle}>For {customer.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.outstandingSummary}>
              <Text style={styles.summaryLabel}>Outstanding Balance</Text>
              <Text style={styles.summaryValue}>₨{customer.currentBalance.toLocaleString()}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount Paid (₨) *</Text>
              <TextInput
                style={styles.modalInput}
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={payNote}
                onChangeText={setPayNote}
                placeholder="e.g. Received cash"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={handlePayment}
              disabled={submitting}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.confirmGradient}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm Payment</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Udhar Modal */}
      <Modal
        visible={udharModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (udharModalView === 'picker') {
            setUdharModalView('form');
          } else {
            setUdharModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            {udharModalView === 'form' ? (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Add Udhar Entry</Text>
                    <Text style={styles.modalSubTitle}>New credit purchase</Text>
                  </View>
                  <TouchableOpacity onPress={() => setUdharModalVisible(false)}>
                    <X size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {udharForm.items.map((item, idx) => (
                    <View key={idx} style={styles.udharItemForm}>
                      <View style={styles.formRow}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.formLabel}>Product</Text>
                          <TouchableOpacity 
                            style={styles.pickerBtn}
                            onPress={() => {
                              setCurrentPickingIndex(idx);
                              setUdharModalView('picker');
                            }}
                          >
                            <Text style={[styles.pickerText, !item.name && { color: 'rgba(255,255,255,0.2)' }]}>
                              {item.name || 'Select Product'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.formLabel}>Qty</Text>
                          <TextInput
                            style={styles.pickerBtn}
                            value={item.quantity.toString()}
                            onChangeText={(val) => updateUdharItem(idx, 'quantity', Number(val))}
                            keyboardType="numeric"
                            placeholder="1"
                          />
                        </View>
                      </View>
                      {udharForm.items.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => {
                            const newItems = udharForm.items.filter((_, i) => i !== idx);
                            setUdharForm({ ...udharForm, items: newItems });
                          }}
                          style={styles.removeItem}
                        >
                          <Text style={styles.removeItemText}>Remove Item</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity 
                    style={styles.addItemBtn}
                    onPress={() => setUdharForm({ ...udharForm, items: [...udharForm.items, { productId: '', quantity: 1, priceAtTime: 0, unit: 'pcs', name: '' }] })}
                  >
                    <Plus size={16} color={Colors.dark.amber} />
                    <Text style={styles.addItemText}>Add Another Item</Text>
                  </TouchableOpacity>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Note (Optional)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={udharForm.description}
                      onChangeText={(val) => setUdharForm({ ...udharForm, description: val })}
                      placeholder="e.g. Monthly groceries"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                  </View>
                </ScrollView>

                <View style={styles.udharFooter}>
                  <View>
                    <Text style={styles.footerLabel}>Grand Total</Text>
                    <Text style={styles.footerValue}>₨{udharTotal.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.confirmUdharBtn}
                    onPress={handleAddUdhar}
                    disabled={submitting}
                  >
                    <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.confirmGradient}>
                      {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm Entry</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Product</Text>
                  <TouchableOpacity onPress={() => setUdharModalView('form')}>
                    <X size={24} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerSearchBar}>
                  <Search size={16} color="rgba(255,255,255,0.3)" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pickerSearchInput}
                    placeholder="Search products..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={productSearch}
                    onChangeText={setProductSearch}
                    autoFocus
                    blurOnSubmit={false}
                  />
                </View>

                <FlatList
                  data={products.filter(p => 
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                  )}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 30 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.productPickerItem}
                      onPress={() => {
                        if (currentPickingIndex !== null) {
                          updateUdharItem(currentPickingIndex, 'productId', item.id);
                        }
                        setUdharModalView('form');
                        setProductSearch('');
                      }}
                    >
                      <View style={styles.productPickerIcon}>
                        <Package size={20} color={Colors.dark.amber} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productPickerName}>{item.name}</Text>
                        <Text style={styles.productPickerPrice}>₨{item.salePrice} / {item.unit}</Text>
                      </View>
                      <Text style={[styles.productPickerStock, item.stock <= (item.minStockLevel || 5) && { color: Colors.dark.rose }]}>
                        {item.stock.toFixed(0)} {item.unit}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: 40 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '700' }}>No products found</Text>
                    </View>
                  }
                />
              </>
            )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    padding: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  avatarTextLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6366f1',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  customerNameLarge: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoTextLarge: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  balanceLabelLarge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceValueLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10b981',
  },
  actionGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 25,
  },
  actionBtnExtended: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  udharItemForm: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pickerBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    color: '#fff',
  },
  pickerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeItem: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  removeItemText: {
    fontSize: 11,
    color: Colors.dark.rose,
    fontWeight: '700',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 16,
    marginBottom: 20,
  },
  addItemText: {
    fontSize: 13,
    color: Colors.dark.amber,
    fontWeight: '800',
  },
  udharFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.dark.rose,
  },
  confirmUdharBtn: {
    width: 160,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#fff',
  },
  listSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  itemsList: {
    marginTop: 4,
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  itemDetails: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  payTxBtn: {
    marginTop: 15,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  payTxBtnText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(244,63,94,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
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
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  modalSubTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginTop: 2,
  },
  outstandingSummary: {
    backgroundColor: 'rgba(244,63,94,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.1)',
    marginBottom: 25,
  },
  summaryLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.dark.rose,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 54,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
  },
  confirmBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
  },
  confirmGradient: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pickerSearchInput: {
    flex: 1,
    height: 46,
    color: '#fff',
    fontSize: 14,
  },
  productPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  productPickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productPickerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  productPickerPrice: {
    fontSize: 12,
    color: Colors.dark.amber,
    fontWeight: '600',
  },
  productPickerStock: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
  },
});
