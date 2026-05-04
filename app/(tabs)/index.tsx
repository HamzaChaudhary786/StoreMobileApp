import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/theme';
import { TrendingUp, Users, Package, AlertCircle, Layers, FileText, BarChart2, ChevronRight, ArrowDownLeft, ArrowUpRight, Clock, ShoppingBag, Activity as ActivityIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardStats {
  todayRevenue: number;
  todayProfit: number;
  totalUdhar: number;
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  recentActivity: Array<{
    id: string;
    name: string;
    amount: number;
    type: 'CASH' | 'UDHAR';
    createdAt: string;
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colors: readonly [string, string, ...string[]];
  glowColor: string;
}


export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data as DashboardStats);
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

  const StatCard = ({ title, value, icon: Icon, colors, glowColor }: StatCardProps) => (
    <LinearGradient colors={colors} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Icon size={18} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      <View style={[styles.cardGlow, { backgroundColor: glowColor }]} />
    </LinearGradient>
  );


  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.businessName}>Store Admin 👋</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SA</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Outstanding Udhar Card (Replica) */}
        <TouchableOpacity 
          style={styles.udharCard}
          onPress={() => router.push('/(tabs)/customers')}
        >
          <LinearGradient 
            colors={['#f43f5e', '#881337']} 
            style={styles.udharGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.udharTop}>
              <View>
                <Text style={styles.udharLabel}>Total Outstanding Udhar</Text>
                <Text style={styles.udharValue}>₨{(stats?.totalUdhar || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.udharIcon}>
                <ArrowUpRight size={24} color="#fff" />
              </View>
            </View>
            <View style={styles.udharBottom}>
              <Text style={styles.udharStatus}>Immediate recovery required</Text>
              <View style={styles.udharAction}>
                <Text style={styles.udharActionText}>Manage Customers</Text>
                <ChevronRight size={14} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard
              title="Today's Revenue"
              value={`₨${(stats?.todayRevenue || 0).toLocaleString()}`}
              icon={TrendingUp}
              colors={['#f59e0b', '#b45309']}
              glowColor="rgba(245,158,11,0.2)"
            />
            <StatCard
              title="Today's Profit"
              value={`₨${(stats?.todayProfit || 0).toLocaleString()}`}
              icon={TrendingUp}
              colors={['#10b981', '#065f46']}
              glowColor="rgba(16,185,129,0.2)"
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard
              title="Active Inventory"
              value={stats?.totalProducts || '0'}
              icon={Package}
              colors={['#6366f1', '#3730a3']}
              glowColor="rgba(99,102,241,0.2)"
            />
            <StatCard
              title="Low Stock"
              value={stats?.lowStock || '0'}
              icon={AlertCircle}
              colors={['#f43f5e', '#9f1239']}
              glowColor="rgba(244,63,94,0.2)"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/customers')}>
            <LinearGradient colors={['rgba(244,63,94,0.15)', 'rgba(244,63,94,0.05)']} style={styles.actionIcon}>
              <Users size={22} color={Colors.dark.rose} />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Customers</Text>
              <Text style={styles.actionDesc}>Udhar & Payments</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/inventory')}>
            <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)']} style={styles.actionIcon}>
              <Package size={22} color="#6366f1" />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Products</Text>
              <Text style={styles.actionDesc}>Browse & manage stock</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-product')}>
            <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']} style={styles.actionIcon}>
              <TrendingUp size={22} color="#10b981" />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Add Product</Text>
              <Text style={styles.actionDesc}>Create new listing</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/bulk-upload' as any)}>
            <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)']} style={styles.actionIcon}>
              <FileText size={22} color="#6366f1" />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Bulk Import</Text>
              <Text style={styles.actionDesc}>Upload CSV products</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/categories')}>
            <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.actionIcon}>
              <Layers size={22} color={Colors.dark.amber} />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Categories</Text>
              <Text style={styles.actionDesc}>Manage departments</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/stock')}>
            <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']} style={styles.actionIcon}>
              <BarChart2 size={22} color="#10b981" />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Inventory Health</Text>
              <Text style={styles.actionDesc}>Stock & Alerts</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/reports')}>
            <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)']} style={styles.actionIcon}>
              <FileText size={22} color="#6366f1" />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Sales Reports</Text>
              <Text style={styles.actionDesc}>Revenue & Profit</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/pos')}>
            <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.actionIcon}>
              <ShoppingBag size={22} color={Colors.dark.amber} />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Point of Sale</Text>
              <Text style={styles.actionDesc}>New cash / Udhar sale</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/explore')}>
            <LinearGradient colors={['rgba(244,63,94,0.15)', 'rgba(244,63,94,0.05)']} style={styles.actionIcon}>
              <ActivityIcon size={22} color={Colors.dark.rose} />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionDesc}>Performance overview</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
          </TouchableOpacity>
        </View>

        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.type === 'UDHAR' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)' }]}>
                  {activity.type === 'UDHAR' ? (
                    <ArrowUpRight size={20} color={Colors.dark.rose} />
                  ) : (
                    <ArrowDownLeft size={20} color="#10b981" />
                  )}
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.activityValue}>
                  <Text style={[styles.activityAmount, { color: activity.type === 'UDHAR' ? Colors.dark.rose : '#10b981' }]}>
                    {activity.type === 'UDHAR' ? '-' : '+'}₨{activity.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.activityType}>{activity.type}</Text>
                </View>
              </View>
            ))

          ) : (
            <View style={styles.emptyContainer}>
              <Clock size={40} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>No recent activities</Text>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 2,
  },
  avatar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  udharCard: {
    marginBottom: 30,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  udharGradient: {
    padding: 25,
  },
  udharTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  udharLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  udharValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  udharIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  udharBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  udharStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  udharAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  udharActionText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  grid: {
    gap: 15,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 15,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    height: 120,
    padding: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  cardGlow: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 1,
    opacity: 0.5,
  },
  actionGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.dark.amber,
    fontWeight: '800',
  },
  activityList: {
    gap: 12,
    marginBottom: 40,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  activityValue: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  activityType: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 30,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
});
