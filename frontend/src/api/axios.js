import axios from 'axios';

const API_URL = 'http://localhost:5000';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add JWT token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
instance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:', {
      status: error.response?.status,
      message: error.response?.data?.msg,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: error.response?.data,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized (401) - Token invalid or expired. Redirecting to login...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('⚠️ Forbidden (403) - Insufficient permissions');
    }

    // Handle CORS errors
    if (error.message === 'Network Error' && !error.response) {
      console.error('🔴 CORS Error or Network Connection Failed');
      console.error('Make sure the backend is running on http://localhost:5000');
    }

    return Promise.reject(error);
  }
);

export default instance;
