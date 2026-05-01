import axios from 'axios';
import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2
// For iOS Simulator, localhost is 127.0.0.1
// For physical devices, use your computer's local IP address
const API_URL = 'https://store-manage-backend.vercel.app/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to add auth token if needed
// (We will handle token storage in the next steps)
