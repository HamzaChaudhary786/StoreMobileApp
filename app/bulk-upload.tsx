import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { api } from '../lib/api';
import { Colors } from '../constants/theme';
import { Upload, FileText, Download, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';

export default function BulkUploadScreen() {
  const router = useRouter();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
        setSuccess(false);
      }
    } catch (err) {
      console.error('Error picking document', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    
    // In React Native, FormData needs this specific structure for files
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: 'text/csv',
    } as any);

    try {
      await api.post('/products/bulk-csv-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
      setFile(null);
      Alert.alert("Success", "Products imported successfully!");
    } catch (error: any) {
      console.error('Upload failed', error);
      Alert.alert("Error", error.response?.data?.message || "Failed to upload CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Bulk Import',
        headerShown: false
      }} />

      <LinearGradient colors={['#1e1b4b', '#0c0c14']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Bulk Import</Text>
          <Text style={styles.headerSubtitle}>Upload CSV Inventory</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.uploadArea}>
            <View style={styles.iconCircle}>
              {success ? (
                <CheckCircle2 size={40} color="#10b981" />
              ) : (
                <Upload size={40} color={file ? '#6366f1' : 'rgba(255,255,255,0.2)'} />
              )}
            </View>
            <Text style={styles.uploadTitle}>
              {file ? file.name : "Select CSV File"}
            </Text>
            <Text style={styles.uploadSubtitle}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Excel or CSV format supported"}
            </Text>

            <TouchableOpacity style={styles.selectBtn} onPress={pickDocument}>
              <Text style={styles.selectBtnText}>{file ? "Change File" : "Choose File"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guideBox}>
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>Required Columns</Text>
              <FileText size={16} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.guideText}>
              • Name (Product Name){'\n'}
              • BuyPrice (Purchase Cost){'\n'}
              • SalePrice (Retail Price){'\n'}
              • Unit (kg, pcs, liter, etc.){'\n'}
              • PiecesPerUnit (for bulk items)
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.uploadBtn, (!file || loading) && styles.disabledBtn]} 
            onPress={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.uploadBtnText}>Start Import</Text>
                <CheckCircle2 size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <AlertCircle size={20} color={Colors.dark.amber} />
          <Text style={styles.infoText}>
            Categories mentioned in the CSV will be automatically created if they don't already exist in your system.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c14',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 32,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  uploadArea: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    borderRadius: 24,
    marginBottom: 25,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
  },
  selectBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  guideBox: {
    width: '100%',
    backgroundColor: 'rgba(99,102,241,0.05)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.1)',
    marginBottom: 25,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guideText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
    fontWeight: '500',
  },
  uploadBtn: {
    width: '100%',
    height: 64,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  disabledBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(245,158,11,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(245,158,11,0.7)',
    fontWeight: '600',
    lineHeight: 18,
  }
});
