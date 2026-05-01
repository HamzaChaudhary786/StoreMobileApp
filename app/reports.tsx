import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, FileText, Wallet, Calendar, TrendingUp, DollarSign, Filter, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ReportsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>({ products: [], grandTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const response = await api.get('/admin/sales-report-data', {
          params: { period: 'today' } // Default to today
        });
        setSalesData(response.data);
      } else {
        const response = await api.get('/admin/inventory-value');
        setInventoryData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  };

  const renderSalesItem = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'CASH' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)' }]}>
          <Text style={[styles.typeText, { color: item.type === 'CASH' ? Colors.dark.amber : Colors.dark.rose }]}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <Text style={styles.customerName}>{item.customer}</Text>
      <Text style={styles.itemsSummary} numberOfLines={2}>{item.items}</Text>
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>Profit</Text>
          <Text style={styles.profitValue}>₨{item.profit.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.totalValue}>₨{item.total.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  const renderInventoryItem = ({ item }: { item: any }) => (
    <View style={styles.inventoryCard}>
      <View style={styles.inventoryIcon}>
        <Text style={styles.inventoryLetter}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.categoryBadge}>{item.category}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.inventoryValue}>₨{item.value.toLocaleString()}</Text>
        <Text style={styles.stockText}>{item.stock} {item.unit}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Detailed Reports</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => setActiveTab('sales')}
        >
          <TrendingUp size={18} color={activeTab === 'sales' ? '#0a0a0f' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
          onPress={() => setActiveTab('inventory')}
        >
          <Wallet size={18} color={activeTab === 'inventory' ? '#0a0a0f' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventory</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'sales' ? (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>₨{salesData.reduce((acc, s) => acc + s.total, 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.summaryLabel}>Total Profit</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>₨{salesData.reduce((acc, s) => acc + s.profit, 0).toLocaleString()}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.valuationHeader}>
          <View style={styles.valuationInfo}>
            <Text style={styles.valuationLabel}>Total Stock Value</Text>
            <Text style={styles.valuationValue}>₨{inventoryData.grandTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.valuationMethod}>
            <Text style={styles.methodText}>Cost-Based (Buy Price)</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.amber} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'sales' ? salesData : inventoryData.products}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          renderItem={activeTab === 'sales' ? renderSalesItem : renderInventoryItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          }
        />
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
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.dark.amber,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  activeTabText: {
    color: '#0a0a0f',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  valuationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(245,158,11,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.1)',
  },
  valuationInfo: {
    flex: 1,
  },
  valuationLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valuationValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark.amber,
  },
  valuationMethod: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  transactionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  itemsSummary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 15,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  profitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.amber,
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inventoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inventoryLetter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  inventoryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark.amber,
    marginBottom: 2,
  },
  stockText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
