import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, Package, Tag, DollarSign, Layers, Weight, Trash2, Save, AlertTriangle, Scan, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    buyPrice: '',
    salePrice: '',
    stock: '',
    minStockLevel: '',
    unit: '',
    piecesPerUnit: '',
    description: '',
    categoryId: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get('/categories')
      ]);
      const product = prodRes.data;
      setForm({
        name: product.name,
        sku: product.sku || '',
        buyPrice: product.buyPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        minStockLevel: product.minStockLevel.toString(),
        unit: product.unit,
        piecesPerUnit: product.piecesPerUnit?.toString() || '1',
        description: product.description || '',
        categoryId: product.categoryId,
      });
      setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
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

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/products/${id}`, {
        ...form,
        buyPrice: Number(form.buyPrice),
        salePrice: Number(form.salePrice),
        stock: Number(form.stock),
        minStockLevel: Number(form.minStockLevel),
        piecesPerUnit: Number(form.piecesPerUnit),
      });
      Alert.alert('Success', 'Product updated! ✨');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to remove this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${id}`);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.amber} />
      </View>
    );
  }

  const InputField = ({ label, value, onChangeText, icon: Icon, keyboardType = 'default' }: any) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon size={20} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: '#fff' }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
        {label === 'SKU / Barcode' && (
          <TouchableOpacity onPress={openScanner}>
            <Scan size={20} color={Colors.dark.amber} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Product</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={24} color={Colors.dark.rose} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
        <InputField
          label="Product Name"
          value={form.name}
          onChangeText={(val: string) => setForm({ ...form, name: val })}
          icon={Package}
        />

        <InputField
          label="SKU / Barcode"
          value={form.sku}
          onChangeText={(val: string) => setForm({ ...form, sku: val })}
          icon={Tag}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Buy Price"
              value={form.buyPrice}
              onChangeText={(val: string) => setForm({ ...form, buyPrice: val })}
              icon={DollarSign}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <InputField
              label="Sale Price"
              value={form.salePrice}
              onChangeText={(val: string) => setForm({ ...form, salePrice: val })}
              icon={DollarSign}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Stock Qty"
              value={form.stock}
              onChangeText={(val: string) => setForm({ ...form, stock: val })}
              icon={Layers}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <InputField
              label="Min Stock"
              value={form.minStockLevel}
              onChangeText={(val: string) => setForm({ ...form, minStockLevel: val })}
              icon={AlertTriangle}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Pieces Per Unit"
              value={form.piecesPerUnit}
              onChangeText={(val: string) => setForm({ ...form, piecesPerUnit: val })}
              icon={Layers}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <InputField
              label="Description"
              value={form.description}
              onChangeText={(val: string) => setForm({ ...form, description: val })}
              icon={Package}
            />
          </View>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat: { id: any; name: any; }) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, form.categoryId === cat.id && styles.selectedChip]}
              onPress={() => setForm({ ...form, categoryId: cat.id })}
            >
              <Text style={[styles.chipText, form.categoryId === cat.id && styles.selectedChipText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#0a0a0f" /> : (
            <>
              <Save size={20} color="#0a0a0f" style={{ marginRight: 10 }} />
              <Text style={styles.saveText}>Update Product</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* SKU Scanner Modal */}
      {scannerVisible && (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            onBarcodeScanned={({ data }:any) => {
              setForm({ ...form, sku: data });
              setScannerVisible(false);
            }}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "code128", "upc_a", "upc_e"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity 
            style={styles.closeScanner}
            onPress={() => setScannerVisible(false)}
          >
            <X size={30} color="#fff" />
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  deleteButton: {
    padding: 5,
  },
  form: {
    padding: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 54,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
    marginTop: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  selectedChip: {
    backgroundColor: Colors.dark.amber,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedChipText: {
    color: '#0a0a0f',
  },
  saveButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: Colors.dark.amber,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  saveText: {
    color: '#0a0a0f',
    fontSize: 18,
    fontWeight: '800',
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
