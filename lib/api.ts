import axios from 'axios';
import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2
// For iOS Simulator, localhost is 127.0.0.1
// For physical devices, use your computer's local IP address
const API_URL = 'http://192.168.1.6:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Interceptor to add auth token if needed
// (We will handle token storage in the next steps)
