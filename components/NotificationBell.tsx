import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter, useNavigation } from 'expo-router';
import { api } from '../lib/api';

export default function NotificationBell() {
  const router = useRouter();
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      const data = res.data;
      if (Array.isArray(data)) {
        const count = data.filter(n => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push('/notifications' as any)}
    >
      <Bell size={22} color="#fff" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 15,
    padding: 5,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#f43f5e', // rose-500
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0c0c14',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  }
});
