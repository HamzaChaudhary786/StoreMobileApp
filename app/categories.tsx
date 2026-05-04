import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, Layers, Plus, X, Search, Package, ChevronRight, ArrowRightLeft, Move, Edit2, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
 
interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
  unit: string;
}


export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);


  // Move Modal State
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [productToMove, setProductToMove] = useState<any>(null);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data as Category[]);

    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories().then(() => setRefreshing(false));
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && editingId) {
        await api.patch(`/categories/${editingId}`, form);
        Alert.alert('Success', 'Category updated! ✨');
      } else {
        await api.post('/categories', form);
        Alert.alert('Success', 'Category created! 📁');
      }
      setCreateModalVisible(false);
      setForm({ name: '', description: '' });
      setIsEditing(false);
      setEditingId(null);
      fetchCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {

    setForm({ name: cat.name, description: cat.description || '' });
    setEditingId(cat.id);
    setIsEditing(true);
    setCreateModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this category? It must be empty.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${id}`);
              fetchCategories();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const fetchCategoryProducts = async (cat: Category) => {

    setSelectedCategory(cat);
    setLoadingProducts(true);
    try {
      const response = await api.get('/products', { params: { category: cat.id } });
      setCategoryProducts(response.data as Product[]);

    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleMoveProduct = async (targetCatId: string) => {
    try {
      await api.patch(`/products/${productToMove.id}/category`, { categoryId: targetCatId });
      Alert.alert('Success', 'Product moved! 📦');
      setMoveModalVisible(false);
      setProductToMove(null);
      if (selectedCategory) fetchCategoryProducts(selectedCategory);
      fetchCategories();

    } catch (error) {
      Alert.alert('Error', 'Failed to move product');
    }
  };

  const filteredCategories = categories
    .filter(c => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const nameLower = c.name.toLowerCase();
      
      const words = searchLower.split(/\s+/).filter(w => w.length > 0);
      return words.every(word => nameLower.includes(word));
    })
    .sort((a, b) => {
      if (!search) return 0;
      const searchLower = search.toLowerCase();
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aExact = aName === searchLower;
      const bExact = bName === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aName.startsWith(searchLower);
      const bStarts = bName.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={24} color={Colors.dark.amber} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.amber} />
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          renderItem={({ item }: { item: Category }) => (

            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => fetchCategoryProducts(item)}
            >
              <LinearGradient 
                colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} 
                style={styles.iconContainer}
              >
                <Layers size={24} color={Colors.dark.amber} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <View style={styles.statsRow}>
                  <Package size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                  <Text style={styles.statsText}>{item._count?.products || 0} Products</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  onPress={() => handleEdit(item)}
                  style={styles.actionBtn}
                >
                  <Edit2 size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id)}
                  style={[styles.actionBtn, { marginLeft: 8 }]}
                >
                  <Trash2 size={16} color="rgba(244,63,94,0.6)" />
                </TouchableOpacity>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Layers size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          }
        />
      )}

      {/* Create Category Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Category' : 'New Category'}</Text>
              <TouchableOpacity onPress={() => {
                setCreateModalVisible(false);
                setIsEditing(false);
                setEditingId(null);
                setForm({ name: '', description: '' });
              }}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
                placeholder="e.g. Beverages"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                value={form.description}
                onChangeText={(val) => setForm({ ...form, description: val })}
                placeholder="Brief description..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.saveGradient}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{isEditing ? 'Update Category' : 'Create Category'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Products Modal (Replica of 'View All') */}
      <Modal
        visible={!!selectedCategory}
        animationType="slide"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <View style={styles.productsModalContainer}>
          <View style={styles.modalHeaderExtended}>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
              <Text style={styles.modalSubTitle}>{categoryProducts.length} Products</Text>
            </View>
          </View>

          {loadingProducts ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={Colors.dark.amber} />
            </View>
          ) : (
            <FlatList
              data={categoryProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }: { item: Product }) => (

                <View style={styles.productItem}>
                  <View style={styles.productIcon}>
                    <Text style={styles.productLetter}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productSub}>₨{item.salePrice} • {item.stock} {item.unit}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.moveBtn}
                    onPress={() => {
                      setProductToMove(item);
                      setMoveModalVisible(true);
                    }}
                  >
                    <ArrowRightLeft size={18} color={Colors.dark.amber} />
                    <Text style={styles.moveText}>Move</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Package size={60} color="rgba(255,255,255,0.05)" />
                  <Text style={styles.emptyText}>No products in this category</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Move Selection Modal */}
        <Modal
          visible={moveModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMoveModalVisible(false)}
        >
          <View style={styles.moveModalOverlay}>
            <View style={styles.moveModalContent}>
              <View style={styles.moveHeader}>
                <Text style={styles.moveTitle}>Move to Category</Text>
                <TouchableOpacity onPress={() => setMoveModalVisible(false)}>
                  <X size={24} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.moveTargetName}>Moving: {productToMove?.name}</Text>
              
              <ScrollView style={styles.moveList}>
                {categories.filter(c => c.id !== selectedCategory?.id).map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={styles.moveTargetItem}
                    onPress={() => handleMoveProduct(cat.id)}
                  >
                    <Layers size={18} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.moveTargetText}>{cat.name}</Text>
                    <ChevronRight size={18} color="rgba(255,255,255,0.1)" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Modal>
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
  searchSection: {
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
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  categoryCard: {
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
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151718',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 50,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 15,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  saveGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  productsModalContainer: {
    flex: 1,
    backgroundColor: '#0c0c14',
  },
  modalHeaderExtended: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#151718',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 25,
  },
  modalSubTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginTop: 2,
  },
  modalListContent: {
    padding: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  productLetter: {
    color: Colors.dark.amber,
    fontSize: 18,
    fontWeight: '900',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  productSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  moveText: {
    fontSize: 12,
    color: Colors.dark.amber,
    fontWeight: '800',
  },
  moveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  moveModalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#1c1c24',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moveTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  moveTargetName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginBottom: 20,
  },
  moveList: {
    marginTop: 10,
  },
  moveTargetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  moveTargetText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
