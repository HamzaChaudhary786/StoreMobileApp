import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform, Alert, ScrollView, Modal, TextInput
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import {
  ChevronLeft, FileText, Wallet, TrendingUp, Download,
  Calendar, Users, Filter, X, CheckCircle
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = 'https://store-manage-backend.vercel.app/api';

type TabType = 'sales' | 'udhar' | 'inventory';
type PeriodType = 'today' | 'week' | 'month' | 'custom';

export default function ReportsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [period, setPeriod] = useState<PeriodType>('today');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [udharData, setUdharData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>({ products: [], grandTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Custom date picker
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = (p: PeriodType) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (p === 'today') {
      // Current day in local time
    } else if (p === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (p === 'month') {
      start.setMonth(start.getMonth() - 1);
    }

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let startStr = formatDate(start);
    let endStr = formatDate(end);

    if (p === 'custom') {
      startStr = customStart || startStr;
      endStr = customEnd || endStr;
    }

    const [sy, sm, sd] = startStr.split('-');
    const [ey, em, ed] = endStr.split('-');
    
    const localStart = new Date(Number(sy), Number(sm) - 1, Number(sd), 0, 0, 0, 0);
    const localEnd = new Date(Number(ey), Number(em) - 1, Number(ed), 23, 59, 59, 999);

    return {
      startDate: localStart.toISOString(),
      endDate: localEnd.toISOString(),
    };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRange(period);

      if (activeTab === 'sales') {
        const res = await api.get('/admin/sales-report-data', { params: range });
        setSalesData(res.data.filter((s: any) => s.type === 'CASH'));
      } else if (activeTab === 'udhar') {
        const res = await api.get('/admin/sales-report-data', { params: range });
        setUdharData(res.data.filter((s: any) => s.type === 'UDHAR'));
      } else {
        const res = await api.get('/admin/inventory-value');
        setInventoryData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, period, customStart, customEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  };

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    setDownloading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const range = getDateRange(period);
      const params = new URLSearchParams({
        period,
        startDate: range.startDate,
        endDate: range.endDate,
        format,
      });
      const url = `${BASE_URL}/admin/export-sales?${params.toString()}`;
      const fileName = `Sales_Report_${period}_${new Date().toISOString().split('T')[0]}.${format}`;
      // Cast to any: expo-file-system v18 type defs are broken for legacy API
      const fs = FileSystem as any;
      const dir: string = fs.documentDirectory || fs.cacheDirectory || '';
      const fileUri = dir + fileName;

      const { uri } = await fs.downloadAsync(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
          dialogTitle: `Sales Report - ${format.toUpperCase()}`,
        });
      } else {
        Alert.alert('Saved', `Report saved to: ${uri}`);
      }
    } catch (error) {
      console.error('Download failed', error);
      Alert.alert('Error', 'Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const PeriodButton = ({ label, value }: { label: string; value: PeriodType }) => (
    <TouchableOpacity
      style={[styles.periodBtn, period === value && styles.periodBtnActive]}
      onPress={() => {
        if (value === 'custom') setDateModalVisible(true);
        else setPeriod(value);
      }}
    >
      <Text style={[styles.periodText, period === value && styles.periodTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const currentData = activeTab === 'sales' ? salesData : udharData;
  const totalRevenue = currentData.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalProfit = currentData.reduce((acc, s) => acc + (s.profit || 0), 0);

  const productSummary = currentData.reduce((acc: any, sale: any) => {
    sale.itemDetails?.forEach((item: any) => {
      const key = `${item.name}-${item.unit}`;
      if (!acc[key]) {
        acc[key] = { name: item.name, quantity: 0, unit: item.unit, total: 0 };
      }
      acc[key].quantity += item.quantity;
      acc[key].total += item.total;
    });
    return acc;
  }, {});

  const renderSalesItem = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, {
          backgroundColor: item.type === 'CASH' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)'
        }]}>
          <Text style={[styles.typeText, {
            color: item.type === 'CASH' ? Colors.dark.amber : Colors.dark.rose
          }]}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.customerLabel}>{item.customer || 'Walk-in'}</Text>
      
      <View style={styles.itemDetailsList}>
        {item.itemDetails?.map((detail: any, idx: number) => (
          <View key={idx} style={styles.detailRow}>
            <Text style={styles.detailName}>{detail.name}</Text>
            <Text style={styles.detailQty}>{detail.quantity} {detail.unit}</Text>
            <Text style={styles.detailPrice}>₨{detail.total.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>PROFIT</Text>
          <Text style={styles.profitValue}>₨{(item.profit || 0).toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.footerLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>₨{(item.total || 0).toLocaleString()}</Text>
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
        <Text style={styles.categoryBadge}>{item.category} • {item.stock} {item.unit}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.inventoryValue}>₨{(item.value || 0).toLocaleString()}</Text>
        <Text style={styles.costText}>@ ₨{(item.costPerUnit || 0).toFixed(1)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Download & analyze your data</Text>
        </View>
        {(activeTab === 'sales' || activeTab === 'udhar') && (
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => {
              Alert.alert('Download Report', 'Choose format', [
                { text: 'Excel (.xlsx)', onPress: () => handleDownload('xlsx') },
                { text: 'CSV (.csv)', onPress: () => handleDownload('csv') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            disabled={downloading}
          >
            {downloading
              ? <ActivityIndicator size="small" color={Colors.dark.amber} />
              : <Download size={22} color={Colors.dark.amber} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => setActiveTab('sales')}
        >
          <TrendingUp size={16} color={activeTab === 'sales' ? '#fff' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'udhar' && styles.activeTabRed]}
          onPress={() => setActiveTab('udhar')}
        >
          <Users size={16} color={activeTab === 'udhar' ? '#fff' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.tabText, activeTab === 'udhar' && styles.activeTabText]}>Udhar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inventory' && styles.activeTabGreen]}
          onPress={() => setActiveTab('inventory')}
        >
          <Wallet size={16} color={activeTab === 'inventory' ? '#fff' : 'rgba(255,255,255,0.4)'} />
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventory</Text>
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
      {activeTab !== 'inventory' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          <PeriodButton label="Today" value="today" />
          <PeriodButton label="This Week" value="week" />
          <PeriodButton label="This Month" value="month" />
          <PeriodButton label="📅 Custom" value="custom" />
        </ScrollView>
      )}

      {/* Summary Cards */}
      {activeTab !== 'inventory' ? (
        <View style={styles.summaryRow}>
          <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₨{totalRevenue.toLocaleString()}</Text>
            <Text style={styles.summaryCount}>{currentData.length} transactions</Text>
          </LinearGradient>
          <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Profit</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>₨{totalProfit.toLocaleString()}</Text>
            <Text style={styles.summaryCount}>
              {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : '—'}
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.03)']} style={styles.inventoryHeader}>
          <View>
            <Text style={styles.summaryLabel}>Total Stock Value</Text>
            <Text style={[styles.summaryValue, { color: Colors.dark.amber, fontSize: 26 }]}>
              ₨{(inventoryData.grandTotal || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>Cost-Based</Text>
          </View>
        </LinearGradient>
      )}

      {/* Product Summary */}
      {!loading && activeTab !== 'inventory' && Object.keys(productSummary).length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Item Sales Summary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
            {Object.values(productSummary).map((item: any, idx: number) => (
              <View key={idx} style={styles.summaryItemCard}>
                <Text style={styles.summaryItemName}>{item.name}</Text>
                <Text style={styles.summaryItemQty}>{item.quantity} {item.unit}</Text>
                <Text style={styles.summaryItemTotal}>₨{item.total.toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.amber} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'inventory' ? inventoryData.products : currentData}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          renderItem={activeTab === 'inventory' ? renderInventoryItem : renderSalesItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyTitle}>No data found</Text>
              <Text style={styles.emptySubtitle}>Try a different period or refresh</Text>
            </View>
          }
        />
      )}

      {/* Custom Date Modal */}
      <Modal
        visible={dateModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Date Range</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <X size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="e.g. 2025-04-01"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="e.g. 2025-04-30"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                if (!customStart || !customEnd) {
                  Alert.alert('Error', 'Please enter both start and end dates');
                  return;
                }
                setPeriod('custom');
                setDateModalVisible(false);
              }}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.applyGradient}>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.applyText}>Apply Filter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c14' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#151718',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 25,
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: 2 },
  downloadBtn: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  tabContainer: {
    flexDirection: 'row', margin: 20, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', height: 40, borderRadius: 12, gap: 6,
  },
  activeTab: { backgroundColor: Colors.dark.amber },
  activeTabRed: { backgroundColor: Colors.dark.rose },
  activeTabGreen: { backgroundColor: '#10b981' },
  tabText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  activeTabText: { color: '#fff' },
  periodRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  periodBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  periodBtnActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: Colors.dark.amber,
  },
  periodText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  periodTextActive: { color: Colors.dark.amber },
  summaryRow: {
    flexDirection: 'row', marginHorizontal: 20,
    marginBottom: 15, gap: 12,
  },
  summaryCard: {
    flex: 1, padding: 16, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.4)',
    fontWeight: '800', textTransform: 'uppercase', marginBottom: 6,
  },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 4 },
  summaryCount: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  inventoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginHorizontal: 20,
    marginBottom: 15, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  costBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  costBadgeText: {
    fontSize: 9, color: 'rgba(255,255,255,0.4)',
    fontWeight: '900', textTransform: 'uppercase',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  transactionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '900' },
  dateText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  customerLabel: {
    fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 12,
  },
  itemDetailsList: {
    marginBottom: 15,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  detailName: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)',
    flex: 2,
  },
  detailQty: {
    fontSize: 11, fontWeight: '800', color: Colors.dark.amber,
    flex: 1, textAlign: 'center',
  },
  detailPrice: {
    fontSize: 12, fontWeight: '800', color: '#fff',
    flex: 1.2, textAlign: 'right',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  summaryScroll: {
    gap: 12,
  },
  summaryItemCard: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    padding: 15,
    borderRadius: 18,
    minWidth: 120,
  },
  summaryItemName: {
    fontSize: 13, fontWeight: '800', color: '#fff',
    marginBottom: 4,
  },
  summaryItemQty: {
    fontSize: 10, fontWeight: '900', color: '#10b981',
    textTransform: 'uppercase', marginBottom: 8,
  },
  summaryItemTotal: {
    fontSize: 14, fontWeight: '900', color: '#fff',
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerLabel: {
    fontSize: 8, color: 'rgba(255,255,255,0.3)',
    fontWeight: '900', textTransform: 'uppercase', marginBottom: 3,
  },
  profitValue: { fontSize: 14, fontWeight: '800', color: '#10b981' },
  totalValue: { fontSize: 16, fontWeight: '900', color: Colors.dark.amber },
  inventoryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inventoryIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  inventoryLetter: { color: Colors.dark.amber, fontSize: 18, fontWeight: '900' },
  productName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  categoryBadge: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  inventoryValue: { fontSize: 15, fontWeight: '800', color: Colors.dark.amber, marginBottom: 2 },
  costText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    alignItems: 'center', justifyContent: 'center', paddingTop: 80,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.25)', fontSize: 16,
    fontWeight: '800', marginTop: 15,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.15)', fontSize: 12,
    fontWeight: '600', marginTop: 6,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151718',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, paddingBottom: 45,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 25,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  inputGroup: { marginBottom: 18 },
  inputLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.5)',
    fontWeight: '700', marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 50, paddingHorizontal: 16,
    color: '#fff', fontSize: 15, fontWeight: '600',
  },
  applyBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  applyGradient: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
