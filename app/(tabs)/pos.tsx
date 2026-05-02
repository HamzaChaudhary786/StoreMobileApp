import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { Search, Plus, Minus, Trash2, ShoppingCart, Scan, X, User, Banknote, CreditCard, ChevronRight } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';

export default function POSScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUdhar, setIsUdhar] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [discount, setDiscount] = useState(0);

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

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
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

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
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
          description: `Mobile POS Udhar Sale: ${cart.map(i => i.name).join(', ')}`
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
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

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

      {isUdhar && cart.length > 0 && (
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
              data={customers.filter(c =>
                (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                (c.phone || '').includes(customerSearch)
              )}
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
        renderItem={({ item }) => {
          const cartItem = cart.find(c => c.id === item.id);
          return (
            <TouchableOpacity 
              style={styles.productCard}
              onPress={() => addToCart(item)}
              disabled={item.stock <= 0}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>₨{item.salePrice} / {item.unit}</Text>
                <Text style={[styles.productStock, item.stock <= 5 && { color: Colors.dark.rose }]}>
                  Stock: {item.stock.toFixed(1)} {item.unit}
                </Text>
              </View>
              {cartItem ? (
                <View style={styles.quantityControls}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, cartItem.quantity - 1)}>
                    <Minus size={18} color={Colors.dark.amber} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                  <TouchableOpacity onPress={() => addToCart(item)}>
                    <Plus size={18} color={Colors.dark.amber} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.addButton, item.stock <= 0 && { opacity: 0.3 }]}>
                  <Plus size={20} color="#0a0a0f" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
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
