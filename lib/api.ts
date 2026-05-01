import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://store-manage-backend.vercel.app/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add token automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Interceptor Error:', e);
  }
  return config;
});
