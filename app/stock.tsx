import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, Package, ArrowUp, ArrowDown, RefreshCcw, Search, AlertTriangle, TrendingUp, Plus, Zap } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function StockScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStock = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch stock', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStock();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStock().then(() => setRefreshing(false));
  };

  const handleUpdateStock = async (id: string, change: number) => {
    try {
      await api.patch(`/products/${id}/stock`, { 
        change, 
        reason: 'MANUAL_ADJUSTMENT' 
      });
      fetchStock();
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.minStockLevel);
  const outOfStockItems = products.filter(p => p.stock === 0);
  const healthyItems = products.filter(p => p.stock > p.minStockLevel);

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

  const StatCard = ({ title, value, icon: Icon, colors }: any) => (
    <LinearGradient colors={colors} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Icon size={20} color="#fff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventory Health</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard title="Out of Stock" value={outOfStockItems.length} icon={AlertTriangle} colors={['#f43f5e', '#9f1239']} />
          <StatCard title="Low Stock" value={lowStockItems.length} icon={RefreshCcw} colors={['#f59e0b', '#b45309']} />
          <StatCard title="Healthy" value={healthyItems.length} icon={TrendingUp} colors={['#10b981', '#065f46']} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={18} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.dark.amber} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listSection}>
            {filteredProducts.map((p) => {
              const isLow = p.stock > 0 && p.stock <= p.minStockLevel;
              const isOut = p.stock === 0;
              const statusColor = isOut ? Colors.dark.rose : isLow ? Colors.dark.amber : '#10b981';
              
              return (
                <View key={p.id} style={styles.stockItem}>
                  <View style={styles.itemMain}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{p.name}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}40` }]}>
                          <Text style={[styles.badgeText, { color: statusColor }]}>
                            {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                          </Text>
                        </View>
                        <Text style={styles.minStockText}>Min: {p.minStockLevel} {p.unit}</Text>
                      </View>
                    </View>
                    <View style={styles.stockDisplay}>
                      <Text style={[styles.stockQty, { color: statusColor }]}>
                        {p.stock.toFixed(0)}
                      </Text>
                      <Text style={styles.unitText}>{p.unit}</Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => handleUpdateStock(p.id, -1)} style={styles.adjustBtn}>
                      <ArrowDown size={16} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleUpdateStock(p.id, 1)} style={styles.adjustBtn}>
                      <ArrowUp size={16} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleUpdateStock(p.id, 10)} 
                      style={styles.replenishBtn}
                    >
                      <Zap size={14} color={Colors.dark.amber} />
                      <Text style={styles.replenishText}>+10 PCS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#fff',
    fontSize: 14,
  },
  listSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stockItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  itemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  stockDisplay: {
    alignItems: 'flex-end',
  },
  stockQty: {
    fontSize: 24,
    fontWeight: '900',
  },
  unitText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 15,
  },
  adjustBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replenishBtn: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  replenishText: {
    color: Colors.dark.amber,
    fontSize: 12,
    fontWeight: '900',
  },
  minStockText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '500',
  },
});
