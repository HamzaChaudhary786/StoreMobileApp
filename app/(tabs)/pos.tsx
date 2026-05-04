import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform, RefreshControl } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { Search, Plus, Minus, Trash2, ShoppingCart, Scan, X, User, Banknote, CreditCard, ChevronRight } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function POSScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isUdhar, setIsUdhar] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [isPaymentOnly, setIsPaymentOnly] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');


  // Customer picker modal
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      
      // Auto-refresh every 30 seconds while screen is focused
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, mode: 'qty' }]);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    const product = products.find(p => p.sku === data);
    if (product) {
      addToCart(product);
      setScannerVisible(false);
    } else {
      Alert.alert('Not Found', `No product found with SKU: ${data}`);
    }
    setTimeout(() => setScanned(false), 1500);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan barcodes');
        return;
      }
    }
    setScannerVisible(true);
  };

  const updateQuantity = (id: string, quantity: number, raw?: string) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, quantity, rawQty: raw } : item));
  };

  const toggleMode = (id: string) => {
    setCart(cart.map(item => item.id === id ? { ...item, mode: item.mode === 'qty' ? 'price' : 'qty', rawQty: '' } : item));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (isPaymentOnly) {
      if (!selectedCustomerId) {
        Alert.alert('Selection Required', 'Please select a customer');
        return;
      }
      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
        return;
      }
      setLoading(true);
      try {
        await api.post('/customers/pay', {
          customerId: selectedCustomerId,
          amount: parseFloat(paymentAmount),
          note: paymentNote || 'Direct Udhar Payment'
        });
        Alert.alert('Success', 'Payment recorded successfully! 💰');
        setIsPaymentOnly(false);
        setPaymentAmount('');
        setPaymentNote('');
        setSelectedCustomerId('');
        setSelectedCustomerName('');
        fetchData();
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to record payment');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (cart.length === 0) return;
    if (isUdhar && !selectedCustomerId) {
      Alert.alert('Selection Required', 'Please select a customer for Udhar sale');
      return;
    }
    
    setLoading(true);
    try {
      if (isUdhar) {
        await api.post('/customers/transaction', {
          customerId: selectedCustomerId,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtTime: item.salePrice
          })),
          description: `Mobile POS Udhar Sale: ${cart.map(i => i.name).join(', ')}`,
          paidAmount: paidAmount
        });
      } else {
        await api.post('/orders', {
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtTime: item.salePrice
          })),
          isUdhar: false
        });
      }
      
      Alert.alert('Success', 'Sale recorded successfully! 🎉');
      setCart([]);
      setIsUdhar(false);
      setSelectedCustomerId('');
      setSelectedCustomerName('');
      setDiscount(0);
      setPaidAmount(0);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(p => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const nameLower = p.name.toLowerCase();
      const skuLower = (p.sku || '').toLowerCase();
      
      const words = searchLower.split(/\s+/).filter(w => w.length > 0);
      return words.every(word => nameLower.includes(word) || skuLower.includes(word));
    })
    .sort((a, b) => {
      if (!search) return 0;
      const searchLower = search.toLowerCase();
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aSku = (a.sku || '').toLowerCase();
      const bSku = (b.sku || '').toLowerCase();

      const aExact = aName === searchLower || aSku === searchLower;
      const bExact = bName === searchLower || bSku === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aName.startsWith(searchLower) || aSku.startsWith(searchLower);
      const bStarts = bName.startsWith(searchLower) || bSku.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={openScanner}
        >
          <Scan size={24} color={Colors.dark.amber} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.paymentOnlyBtn, isPaymentOnly && styles.paymentOnlyBtnActive]}
          onPress={() => {
            setIsPaymentOnly(!isPaymentOnly);
            if (!isPaymentOnly) {
              setCart([]);
              setIsUdhar(true);
            }
          }}
        >
          <Banknote size={24} color={isPaymentOnly ? '#0a0a0f' : Colors.dark.amber} />
        </TouchableOpacity>
      </View>

      {cart.length > 0 && (
        <View style={styles.paymentTypeBar}>
          <TouchableOpacity 
            style={[styles.typeBtn, !isUdhar && styles.activeCash]}
            onPress={() => setIsUdhar(false)}
          >
            <Banknote size={16} color={!isUdhar ? '#0a0a0f' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.typeText, !isUdhar && styles.activeTypeText]}>Cash Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, isUdhar && styles.activeUdhar]}
            onPress={() => setIsUdhar(true)}
          >
            <CreditCard size={16} color={isUdhar ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.typeText, isUdhar && styles.activeTypeText]}>Udhar Sale</Text>
          </TouchableOpacity>
        </View>
      )}

      {isUdhar && (cart.length > 0 || isPaymentOnly) && (
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => setCustomerModalVisible(true)}
        >
          <User size={18} color={Colors.dark.rose} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorLabel}>Udhar Customer</Text>
            <Text style={[styles.selectorValue, !selectedCustomerId && { color: 'rgba(255,255,255,0.3)' }]}>
              {selectedCustomerName || 'Tap to select customer...'}
            </Text>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      )}

      {/* Customer Picker Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.custModalOverlay}>
          <View style={styles.custModalContent}>
            <View style={styles.custModalHeader}>
              <Text style={styles.custModalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <X size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <View style={styles.custSearchBar}>
              <Search size={16} color="rgba(255,255,255,0.3)" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.custSearchInput}
                placeholder="Search customers..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={customerSearch}
                onChangeText={setCustomerSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={customers
                .filter(c => {
                  if (!customerSearch) return true;
                  const searchLower = customerSearch.toLowerCase();
                  const nameLower = (c.name || '').toLowerCase();
                  const phoneLower = (c.phone || '').toLowerCase();
                  
                  const words = searchLower.split(/\s+/).filter(w => w.length > 0);
                  return words.every(word => nameLower.includes(word) || phoneLower.includes(word));
                })
                .sort((a, b) => {
                  if (!customerSearch) return 0;
                  const searchLower = customerSearch.toLowerCase();
                  const aName = (a.name || '').toLowerCase();
                  const bName = (b.name || '').toLowerCase();
                  
                  const aExact = aName === searchLower || a.phone === searchLower;
                  const bExact = bName === searchLower || b.phone === searchLower;
                  if (aExact && !bExact) return -1;
                  if (!aExact && bExact) return 1;
                  
                  const aStarts = aName.startsWith(searchLower) || (a.phone || '').startsWith(searchLower);
                  const bStarts = bName.startsWith(searchLower) || (b.phone || '').startsWith(searchLower);
                  if (aStarts && !bStarts) return -1;
                  if (!aStarts && bStarts) return 1;
                  
                  return aName.localeCompare(bName);
                })
              }
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 30 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.custItem,
                    selectedCustomerId === item.id && styles.custItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCustomerId(item.id);
                    setSelectedCustomerName(item.name);
                    setCustomerModalVisible(false);
                    setCustomerSearch('');
                  }}
                >
                  <View style={styles.custAvatar}>
                    <Text style={styles.custAvatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.custName}>{item.name}</Text>
                    <Text style={styles.custPhone}>{item.phone}</Text>
                  </View>
                  <View style={styles.custBalance}>
                    <Text style={[(item.currentBalance || 0) > 0 ? styles.custBalanceRed : styles.custBalanceGreen]}>
                      ₨{(item.currentBalance || 0).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '700' }}>No customers found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.amber} />
        }
        renderItem={({ item }) => {
          const cartItem = cart.find(c => c.id === item.id);
          return (
            <View style={styles.productCard}>
              <TouchableOpacity 
                style={{ flex: 1 }}
                onPress={() => addToCart(item)}
                disabled={item.stock <= 0}
              >
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>₨{item.salePrice} / {item.unit}</Text>
                <Text style={[styles.productStock, item.stock <= 5 && { color: Colors.dark.rose }]}>
                  Stock: {item.stock.toFixed(1)} {item.unit}
                </Text>
              </TouchableOpacity>
              {cartItem ? (
                <View style={styles.cartControlWrapper}>
                  <View style={styles.modeToggleMini}>
                    <TouchableOpacity 
                      onPress={() => toggleMode(item.id)}
                      style={[styles.miniModeBtn, cartItem.mode === 'qty' && styles.miniModeBtnActive]}
                    >
                      <Text style={[styles.miniModeText, cartItem.mode === 'qty' && styles.miniModeTextActive]}>QTY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => toggleMode(item.id)}
                      style={[styles.miniModeBtn, cartItem.mode === 'price' && styles.miniModeBtnActive]}
                    >
                      <Text style={[styles.miniModeText, cartItem.mode === 'price' && styles.miniModeTextActive]}>RS</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.quantityControls}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, cartItem.quantity - 1)}>
                      <Minus size={16} color={Colors.dark.amber} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.quantityInput}
                      value={cartItem.rawQty !== undefined ? cartItem.rawQty : cartItem.quantity.toString()}
                      keyboardType="numeric"
                      onChangeText={(val) => {
                        const num = parseFloat(val);
                        if (cartItem.mode === 'price') {
                          if (!isNaN(num)) updateQuantity(item.id, num / item.salePrice, val);
                          else updateQuantity(item.id, 0, val);
                        } else {
                          if (!isNaN(num)) updateQuantity(item.id, num, val);
                          else updateQuantity(item.id, 0, val);
                        }
                      }}
                    />
                    <TouchableOpacity onPress={() => updateQuantity(item.id, cartItem.quantity + 1)}>
                      <Plus size={16} color={Colors.dark.amber} />
                    </TouchableOpacity>
                  </View>
                  {cartItem.mode === 'price' && (
                    <Text style={styles.calcPreview}>{cartItem.quantity.toFixed(2)} {item.unit}</Text>
                  )}
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => addToCart(item)}
                  disabled={item.stock <= 0}
                  style={[styles.addButton, item.stock <= 0 && { opacity: 0.3 }]}
                >
                  <Plus size={20} color="#0a0a0f" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          isPaymentOnly ? (
            <View style={styles.paymentOnlyContainer}>
              <Text style={styles.paymentOnlyTitle}>Record Direct Payment</Text>
              <Text style={styles.paymentOnlyDesc}>Reduce customer Udhar balance without a sale</Text>
              
              <View style={styles.paymentInputGroup}>
                <Text style={styles.paymentLabel}>Amount to Pay (₨)</Text>
                <TextInput
                  style={styles.paymentInput}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>

              <View style={styles.paymentInputGroup}>
                <Text style={styles.paymentLabel}>Note (Optional)</Text>
                <TextInput
                  style={[styles.paymentInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                  placeholder="e.g. Paid half of remaining balance"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={styles.payNowBtn}
                onPress={handleCheckout}
                disabled={loading}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={styles.payNowGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payNowText}>Record Payment Now</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "code128", "upc_a", "upc_e"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
            <Text style={styles.scannerText}>Center the barcode inside the box</Text>
            <TouchableOpacity 
              style={styles.closeScanner}
              onPress={() => setScannerVisible(false)}
            >
              <X size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {cart.length > 0 && (
        <View style={styles.checkoutContainer}>
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>Discount (₨)</Text>
            <TextInput
              style={styles.discountInput}
              keyboardType="numeric"
              value={discount.toString()}
              onChangeText={(val) => setDiscount(Number(val) || 0)}
            />
          </View>
          {isUdhar && (
            <View style={{ marginBottom: 15, padding: 12, backgroundColor: 'rgba(244,63,94,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 10, color: Colors.dark.rose, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Initial Payment (₨)</Text>
                  <TextInput
                    style={{ fontSize: 18, color: '#fff', fontWeight: '800', padding: 0 }}
                    value={paidAmount.toString()}
                    onChangeText={(val) => setPaidAmount(parseFloat(val) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>Remaining Udhar</Text>
                  <Text style={{ fontSize: 18, color: Colors.dark.rose, fontWeight: '800' }}>₨{(total - paidAmount).toFixed(0)}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={[styles.totalValue, isUdhar && { color: Colors.dark.rose }]}>
              ₨{total.toFixed(0)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={handleCheckout}
            disabled={loading}
          >
            <LinearGradient 
              colors={isUdhar ? ['#f43f5e', '#e11d48'] : ['#f59e0b', '#d97706']} 
              style={styles.checkoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ShoppingCart size={20} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.checkoutText}>
                    {isUdhar ? 'Post Udhar Sale' : 'Complete Cash Sale'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  paymentTypeBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  activeCash: {
    backgroundColor: Colors.dark.amber,
  },
  activeUdhar: {
    backgroundColor: Colors.dark.rose,
  },
  activeTypeText: {
    color: '#fff',
  },
  paymentOnlyBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  paymentOnlyBtnActive: {
    backgroundColor: '#10b981',
  },
  paymentOnlyContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  paymentOnlyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  paymentOnlyDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginBottom: 20,
  },
  paymentInputGroup: {
    marginBottom: 15,
  },
  paymentLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  paymentInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 50,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  payNowBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  payNowGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(244,63,94,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)',
  },
  selectorLabel: {
    fontSize: 10,
    color: Colors.dark.rose,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  selectorValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  custModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  custModalContent: {
    backgroundColor: '#151718',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    maxHeight: '80%',
  },
  custModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  custModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  custSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  custSearchInput: {
    flex: 1,
    height: 46,
    color: '#fff',
    fontSize: 14,
  },
  custItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  custItemSelected: {
    backgroundColor: 'rgba(244,63,94,0.08)',
  },
  custAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  custAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6366f1',
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  custPhone: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  custBalance: {
    alignItems: 'flex-end',
  },
  custBalanceRed: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark.rose,
  },
  custBalanceGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 13,
    color: Colors.dark.amber,
    fontWeight: '600',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.dark.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 6,
    borderRadius: 10,
  },
  quantityText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
  quantityInput: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
    padding: 0,
  },
  cartControlWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  modeToggleMini: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 2,
  },
  miniModeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniModeBtnActive: {
    backgroundColor: Colors.dark.amber,
  },
  miniModeText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
  },
  miniModeTextActive: {
    color: '#000',
  },
  calcPreview: {
    fontSize: 9,
    color: Colors.dark.amber,
    fontWeight: '700',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#151718',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  discountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  discountInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: Colors.dark.amber,
    width: 80,
    height: 34,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.amber,
  },
  checkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkoutGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.dark.amber,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  closeScanner: {
    position: 'absolute',
    top: 50,
    right: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
