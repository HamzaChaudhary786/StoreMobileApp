import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { TrendingUp, ShoppingBag, Users, DollarSign, ArrowUpRight, ArrowDownRight, Calendar, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Icon size={22} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {trend && (
          <View style={styles.trendRow}>
            {trend > 0 ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color={Colors.dark.rose} />}
            <Text style={[styles.trendText, { color: trend > 0 ? '#10b981' : Colors.dark.rose }]}>
              {Math.abs(trend)}% vs last month
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity 
          style={styles.detailedReportsBtn}
          onPress={() => router.push('/reports')}
        >
          <FileText size={18} color={Colors.dark.amber} />
          <Text style={styles.detailedReportsText}>Detailed Reports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <StatCard 
          title="Total Revenue" 
          value={`₨${stats?.revenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          color={Colors.dark.amber}
          trend={12}
        />
        <StatCard 
          title="Total Sales" 
          value={stats?.totalOrders || '0'}
          icon={ShoppingBag}
          color="#6366f1"
          trend={8}
        />
        <StatCard 
          title="New Customers" 
          value={stats?.totalCustomers || '0'}
          icon={Users}
          color="#10b981"
          trend={15}
        />
        <StatCard 
          title="Active Products" 
          value={stats?.totalProducts || '0'}
          icon={TrendingUp}
          color="#ec4899"
        />
      </View>

      <Text style={styles.sectionTitle}>Performance Overview</Text>
      <View style={styles.chartPlaceholder}>
        <View style={styles.chartBarGroup}>
          {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
            <View key={i} style={[styles.chartBar, { height: h }]} />
          ))}
        </View>
        <View style={styles.chartLabels}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
            <Text key={i} style={styles.chartLabel}>{l}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Insights</Text>
      <View style={styles.insightCard}>
        <Text style={styles.insightText}>
          Your sales are up by <Text style={{ color: '#10b981', fontWeight: '800' }}>12%</Text> compared to last week. Most of the revenue is coming from <Text style={{ color: Colors.dark.amber, fontWeight: '800' }}>Grocery</Text> category.
        </Text>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  detailedReportsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  detailedReportsText: {
    color: Colors.dark.amber,
    fontSize: 12,
    fontWeight: '800',
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  chartPlaceholder: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginBottom: 15,
  },
  chartBar: {
    width: 12,
    backgroundColor: Colors.dark.amber,
    borderRadius: 6,
    opacity: 0.8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
  },
  insightCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(245,158,11,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.1)',
  },
  insightText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
