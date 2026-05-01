import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { Search, Package, AlertTriangle, Plus, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts().then(() => setRefreshing(false));
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity 
            style={styles.categoryBtn}
            onPress={() => router.push('/categories')}
          >
            <Plus size={20} color={Colors.dark.amber} />
            <Text style={styles.categoryBtnText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.productCard}
            onPress={() => router.push({ pathname: '/product-details', params: { id: item.id } })}
          >
            <View style={styles.iconContainer}>
              <Package size={24} color={Colors.dark.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productSku}>{item.sku || 'No SKU'}</Text>
              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.label}>Buy Price</Text>
                  <Text style={styles.value}>₨{item.buyPrice}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Sale Price</Text>
                  <Text style={styles.value}>₨{item.salePrice}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Stock</Text>
                  <Text style={[styles.value, item.stock <= item.minStockLevel && { color: Colors.dark.rose }]}>
                    {item.stock.toFixed(1)} {item.unit}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardActions}>
              {item.stock <= item.minStockLevel && (
                <AlertTriangle size={18} color={Colors.dark.rose} />
              )}
              <Edit2 size={18} color="rgba(255,255,255,0.2)" style={{ marginTop: 10 }} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-product')}
      >
        <Plus size={30} color="#0a0a0f" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c14',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    gap: 6,
  },
  categoryBtnText: {
    color: Colors.dark.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  productCard: {
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
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  cardActions: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.amber,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.dark.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
