import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform, Modal
} from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { ChevronLeft, Package, Tag, Layers, Scan, X, TrendingUp, BarChart2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';

const UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'liter', label: 'Liters (ltr)' },
  { value: 'packet', label: 'Packets (pkt)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'gram', label: 'Grams (g)' },
  { value: 'box', label: 'Box' },
  { value: 'crate', label: 'Crate' },
];

const WEIGHT_UNITS = ['kg', 'liter', 'gram'];

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [priceMode, setPriceMode] = useState<'single' | 'box'>('single');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    buyPrice: '',
    salePrice: '',
    minStockLevel: '5',
    unit: 'pcs',
    piecesPerUnit: '1',
    description: '',
    categoryId: '',
  });

  const [stockEntry, setStockEntry] = useState({ boxes: '', pieces: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { console.error('Failed to fetch categories'); }
  };

  const isWeightUnit = WEIGHT_UNITS.includes(form.unit);

  const handleUnitChange = useCallback((unit: string) => {
    setForm(prev => ({
      ...prev,
      unit,
      piecesPerUnit: WEIGHT_UNITS.includes(unit) ? '1' : prev.piecesPerUnit,
    }));
    if (WEIGHT_UNITS.includes(unit)) setPriceMode('single');
  }, []);

  const handlePriceModeChange = (mode: 'single' | 'box') => {
    setPriceMode(mode);
    if (mode === 'single') {
      setForm(prev => ({ ...prev, piecesPerUnit: '1' }));
      setStockEntry(prev => ({ ...prev, boxes: '' }));
    }
  };

  // Live profit calc
  const buy = parseFloat(form.buyPrice) || 0;
  const sale = parseFloat(form.salePrice) || 0;
  const ppu = parseInt(form.piecesPerUnit) || 1;
  const costPerPiece = priceMode === 'box' ? buy / ppu : buy;
  const profitPerPiece = sale - costPerPiece;
  const profitMargin = costPerPiece > 0 ? (profitPerPiece / costPerPiece) * 100 : 0;

  // Total stock preview
  const totalStock = priceMode === 'box'
    ? (parseInt(stockEntry.boxes) || 0) * ppu + (parseFloat(stockEntry.pieces) || 0)
    : parseFloat(stockEntry.pieces) || 0;

  const handleSave = async () => {
    if (!form.name || !form.buyPrice || !form.salePrice || !form.categoryId) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Prices, Category)');
      return;
    }
    if (!stockEntry.pieces && !stockEntry.boxes) {
      Alert.alert('Error', 'Please enter initial stock quantity');
      return;
    }

    setLoading(true);
    try {
      const finalBuyPrice = priceMode === 'box' ? buy * ppu : buy;
      const finalStock = priceMode === 'box'
        ? (parseInt(stockEntry.boxes) || 0) * ppu + (parseFloat(stockEntry.pieces) || 0)
        : parseFloat(stockEntry.pieces) || 0;

      await api.post('/products', {
        name: form.name,
        sku: form.sku,
        description: form.description,
        buyPrice: finalBuyPrice,
        salePrice: sale,
        stock: finalStock,
        minStockLevel: parseFloat(form.minStockLevel) || 5,
        unit: form.unit,
        piecesPerUnit: ppu,
        categoryId: form.categoryId,
      });
      Alert.alert('Success', 'Product added successfully! 🎉');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission Required', 'Camera permission is needed'); return; }
    }
    setScannerVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Add New Product</Text>
          <Text style={styles.subtitle}>Stock your shelves</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        {/* SECTION: Basic Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={14} color={Colors.dark.amber} />
            <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
              placeholder="e.g. Tibet Soap"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SKU / Barcode</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={form.sku}
                onChangeText={v => setForm(p => ({ ...p, sku: v }))}
                placeholder="Scan or type SKU"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
              <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
                <Scan size={20} color={Colors.dark.amber} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, form.categoryId === cat.id && styles.chipActive]}
                    onPress={() => setForm(p => ({ ...p, categoryId: cat.id }))}
                  >
                    <Text style={[styles.chipText, form.categoryId === cat.id && styles.chipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Unit Type *</Text>
            <View style={styles.unitGrid}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.unitChip, form.unit === u.value && styles.unitChipActive]}
                  onPress={() => handleUnitChange(u.value)}
                >
                  <Text style={[styles.unitChipText, form.unit === u.value && styles.unitChipTextActive]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION: Pricing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag size={14} color={Colors.dark.amber} />
            <Text style={styles.sectionTitle}>PRICING & COST</Text>
          </View>

          {!isWeightUnit && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>How do you buy this?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, priceMode === 'single' && styles.toggleActive]}
                  onPress={() => handlePriceModeChange('single')}
                >
                  <Text style={[styles.toggleText, priceMode === 'single' && styles.toggleTextActive]}>By Piece</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, priceMode === 'box' && styles.toggleActive]}
                  onPress={() => handlePriceModeChange('box')}
                >
                  <Text style={[styles.toggleText, priceMode === 'box' && styles.toggleTextActive]}>By Box / Pack</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                {priceMode === 'box' ? 'Purchase Price (Full Box)' : `Cost Price (per ${form.unit})`}
              </Text>
              <TextInput
                style={styles.input}
                value={form.buyPrice}
                onChangeText={v => setForm(p => ({ ...p, buyPrice: v }))}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.label}>Sale Price (per {form.unit})</Text>
              <TextInput
                style={styles.input}
                value={form.salePrice}
                onChangeText={v => setForm(p => ({ ...p, salePrice: v }))}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {priceMode === 'box' && !isWeightUnit && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Items in 1 Box / Pack</Text>
              <TextInput
                style={styles.input}
                value={form.piecesPerUnit}
                onChangeText={v => setForm(p => ({ ...p, piecesPerUnit: v }))}
                placeholder="e.g. 12"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Live Profit Preview */}
          {buy > 0 && sale > 0 && (
            <LinearGradient
              colors={profitPerPiece >= 0 ? ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.04)'] : ['rgba(244,63,94,0.12)', 'rgba(244,63,94,0.04)']}
              style={styles.profitCard}
            >
              <View>
                <Text style={styles.profitLabel}>PROFIT CALCULATION</Text>
                <Text style={styles.profitSub}>
                  {priceMode === 'box'
                    ? `Box: ₨${buy} | Per piece cost: ₨${costPerPiece.toFixed(2)}`
                    : `Cost per ${form.unit}: ₨${buy}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.profitValue, { color: profitPerPiece >= 0 ? '#10b981' : Colors.dark.rose }]}>
                  {profitPerPiece >= 0 ? '+' : ''}₨{profitPerPiece.toFixed(2)}
                </Text>
                <Text style={[styles.profitMargin, { color: profitPerPiece >= 0 ? '#10b981' : Colors.dark.rose }]}>
                  {profitMargin.toFixed(1)}% margin
                </Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* SECTION: Inventory */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart2 size={14} color="#10b981" />
            <Text style={[styles.sectionTitle, { color: '#10b981' }]}>INVENTORY SETUP</Text>
          </View>

          <View style={styles.stockBox}>
            {isWeightUnit ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Initial Weight ({form.unit})</Text>
                <TextInput
                  style={styles.input}
                  value={stockEntry.pieces}
                  onChangeText={v => setStockEntry(p => ({ ...p, pieces: v }))}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="decimal-pad"
                />
              </View>
            ) : (
              <View style={styles.twoCol}>
                {priceMode === 'box' && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Full Boxes</Text>
                    <TextInput
                      style={styles.input}
                      value={stockEntry.boxes}
                      onChangeText={v => setStockEntry(p => ({ ...p, boxes: v }))}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="number-pad"
                    />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: priceMode === 'box' ? 12 : 0 }}>
                  <Text style={styles.label}>
                    {priceMode === 'box' ? 'Loose Pieces' : 'Initial Piece Count'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={stockEntry.pieces}
                    onChangeText={v => setStockEntry(p => ({ ...p, pieces: v }))}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}

            {priceMode === 'box' && !isWeightUnit && (buy > 0 || stockEntry.boxes || stockEntry.pieces) && (
              <View style={styles.stockPreview}>
                <Text style={styles.stockPreviewLabel}>TOTAL STOCK</Text>
                <Text style={styles.stockPreviewValue}>{totalStock.toFixed(0)} pieces</Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Low Stock Warning At...</Text>
            <TextInput
              style={styles.input}
              value={form.minStockLevel}
              onChangeText={v => setForm(p => ({ ...p, minStockLevel: v }))}
              placeholder="5"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* SECTION: Description */}
        <View style={styles.section}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Product details, notes..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.saveGradient}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveText}>Add to Inventory</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* SKU Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            onBarcodeScanned={({ data }) => {
              setForm(p => ({ ...p, sku: data }));
              setScannerVisible(false);
            }}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128', 'upc_a', 'upc_e'] }}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.closeScannerBtn}
            onPress={() => setScannerVisible(false)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c14' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#151718',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: 2 },
  form: { padding: 20, paddingBottom: 60 },
  section: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 24, padding: 18,
    marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 18, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '900', letterSpacing: 1.5,
    color: Colors.dark.amber,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 10, color: 'rgba(255,255,255,0.45)',
    fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 50, paddingHorizontal: 15,
    color: '#fff', fontSize: 15, fontWeight: '600',
    marginBottom: 0,
  },
  textArea: {
    height: 90, paddingTop: 14, textAlignVertical: 'top',
  },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  scanBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  twoCol: { flexDirection: 'row' },
  unitGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  unitChipActive: {
    backgroundColor: Colors.dark.amber,
    borderColor: Colors.dark.amber,
  },
  unitChipText: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700',
  },
  unitChipTextActive: { color: '#0a0a0f' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: Colors.dark.amber,
    borderColor: Colors.dark.amber,
  },
  chipText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  chipTextActive: { color: '#0a0a0f' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 4, gap: 4,
  },
  toggleBtn: {
    flex: 1, height: 40, alignItems: 'center',
    justifyContent: 'center', borderRadius: 10,
  },
  toggleActive: { backgroundColor: Colors.dark.amber },
  toggleText: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
  toggleTextActive: { color: '#0a0a0f' },
  profitCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
    marginTop: 4,
  },
  profitLabel: {
    fontSize: 9, fontWeight: '900', letterSpacing: 1.5,
    color: '#10b981', marginBottom: 4,
  },
  profitSub: {
    fontSize: 10, color: 'rgba(16,185,129,0.6)', fontWeight: '600',
  },
  profitValue: { fontSize: 20, fontWeight: '900' },
  profitMargin: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  stockBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  stockPreview: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12,
    marginTop: 8, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stockPreviewLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.3)',
    fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
  },
  stockPreviewValue: {
    fontSize: 15, color: Colors.dark.amber, fontWeight: '900',
  },
  saveButton: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  saveGradient: {
    height: 58, alignItems: 'center', justifyContent: 'center',
  },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  closeScannerBtn: {
    position: 'absolute', top: 50, right: 20,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
});
