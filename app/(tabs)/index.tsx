import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { TrendingUp, Users, Package, AlertCircle } from 'lucide-react-native';

export default function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Assuming you have an endpoint for high-level stats
      // If not, we could fetch separate data (products, orders, customers)
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

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.grid}>
          <StatCard
            title="Total Sales"
            value={`₨${stats?.totalSales?.toFixed(0) || '0'}`}
            icon={TrendingUp}
            color={Colors.dark.amber}
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers || '0'}
            icon={Users}
            color="#6366f1"
          />
          <StatCard
            title="Active Inventory"
            value={stats?.totalProducts || '0'}
            icon={Package}
            color="#10b981"
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockCount || '0'}
            icon={AlertCircle}
            color={Colors.dark.rose}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Recent Activities</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent activities to show</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c14',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  card: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontWeight: '600',
  },
});
