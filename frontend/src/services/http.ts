import axios, { type AxiosError, type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

interface ApiErrorBody {
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Normalizes Axios errors into a `new Error(...)` whose message combines
 * message/details/hint, matching how the backend returns structured errors.
 */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data ?? {};
    const combined = [body.message, body.details, body.hint].filter(Boolean).join(' | ');
    return Promise.reject(new Error(combined || error.message || 'Request failed'));
  },
);

export const API_BASE_URL = baseURL;
