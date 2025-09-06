import { Platform } from 'react-native';

// Prefer EXPO_PUBLIC_API_BASE_URL if provided, else use sensible defaults per platform
const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

// Android emulator maps localhost to 10.0.2.2; iOS simulator can use localhost
const defaultBaseUrl = Platform.select({
  android: 'https://backend-sql-9ck0.onrender.com',
  ios: 'http://localhost:5000',
  default: 'https://backend-sql-9ck0.onrender.com',
});

export const API_BASE_URL = envBaseUrl || defaultBaseUrl;


