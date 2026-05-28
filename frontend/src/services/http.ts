import axios, { type AxiosError, type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 300_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && !token.startsWith('mock-token-') && !token.startsWith('dev-token-')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ApiErrorBody {
  message?: string;
  details?: string;
  hint?: string;
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data ?? {};
    const combined = [body.message, body.details, body.hint].filter(Boolean).join(' | ');
    return Promise.reject(new Error(combined || error.message || 'Request failed'));
  },
);

export const API_BASE_URL = baseURL;
