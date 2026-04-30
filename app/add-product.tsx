import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, Package, Tag, DollarSign, Layers, Weight, Scan, Banknote, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    buyPrice: '',
    salePrice: '',
    stock: '',
    minStockLevel: '5',
    unit: 'pcs',
    categoryId: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
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

  const handleSave = async () => {
    if (!form.name || !form.buyPrice || !form.salePrice || !form.stock || !form.categoryId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/products', {
        ...form,
        buyPrice: Number(form.buyPrice),
        salePrice: Number(form.salePrice),
        stock: Number(form.stock),
        minStockLevel: Number(form.minStockLevel),
      });
      Alert.alert('Success', 'Product added successfully! 🎉');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default' }: any) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon size={20} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
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
        <Text style={styles.title}>Add New Product</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
        <InputField
          label="Product Name *"
          value={form.name}
          onChangeText={(val: string) => setForm({ ...form, name: val })}
          placeholder="e.g. Coca Cola 1.5L"
          icon={Package}
        />

        <InputField
          label="SKU / Barcode"
          value={form.sku}
          onChangeText={(val: string) => setForm({ ...form, sku: val })}
          placeholder="Scan or enter SKU"
          icon={Tag}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Buy Price *"
              value={form.buyPrice}
              onChangeText={(val: string) => setForm({ ...form, buyPrice: val })}
              placeholder="0.00"
              icon={DollarSign}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <InputField
              label="Sale Price *"
              value={form.salePrice}
              onChangeText={(val: string) => setForm({ ...form, salePrice: val })}
              placeholder="0.00"
              icon={Banknote}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Stock Qty *"
              value={form.stock}
              onChangeText={(val: string) => setForm({ ...form, stock: val })}
              placeholder="0"
              icon={Layers}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <InputField
              label="Unit (pcs/kg) *"
              value={form.unit}
              onChangeText={(val: string) => setForm({ ...form, unit: val })}
              placeholder="pcs"
              icon={Weight}
            />
          </View>
        </View>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat:{ id: any; name: any; }) => (
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
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.saveText}>Save Product</Text>}
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
    color: '#fff',
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
    height: 56,
    backgroundColor: Colors.dark.amber,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
