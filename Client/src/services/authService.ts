import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      isFirstLogin?: boolean;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Authentication functions
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post('/clientusers/login', credentials);
    
    if (response.data.success) {
      // Store token and user data
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/';
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

export const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await api.post('/auth/refresh');
    if (response.data.success) {
      localStorage.setItem('authToken', response.data.data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export default api;
