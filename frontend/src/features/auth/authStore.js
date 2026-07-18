import { create } from 'zustand';
import apiClient from '../../api/apiClient';

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const token = localStorage.getItem('accessToken');
const decoded = token ? decodeToken(token) : null;

export const useAuthStore = create((set, get) => ({
  user: decoded ? { _id: decoded._id, role: decoded.role } : null, 
  role: decoded ? decoded.role : null, 
  accessToken: token || null,
  isAuthenticated: !!token,
  loading: false,
  error: null,

  setToken: (token) => {
    localStorage.setItem('accessToken', token);
    const decodedToken = decodeToken(token);
    set({ 
      accessToken: token, 
      isAuthenticated: true,
      role: decodedToken ? decodedToken.role : null,
      user: decodedToken ? { _id: decodedToken._id, role: decodedToken.role } : null
    });
  },

  setRole: (role) => {
    set({ role });
  },

  setUser: (user) => {
    set({ user });
  },

  loginEmployee: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/login-employee', { email, password });
      const { employee, accessToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user: employee, role: 'employee', accessToken, isAuthenticated: true, loading: false });
      return { success: true, employee };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  loginAdmin: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/login-admin', { email, password });
      const { admin, accessToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user: admin, role: 'admin', accessToken, isAuthenticated: true, loading: false });
      return { success: true, admin };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  loginGoogle: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/google', { idToken });
      const { employee, accessToken, onboardingRequired } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user: employee, role: 'employee', accessToken, isAuthenticated: true, loading: false });
      return { success: true, onboardingRequired, employee };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Google Login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  registerEmployee: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/register-employee', formData);
      set({ loading: false });
      return { success: true, data: data.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  registerOrg: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/register-org', formData);
      set({ loading: false });
      return { success: true, data: data.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Organization registration failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  fetchProfile: async () => {
    if (get().role === 'admin') return; 
    try {
      const { data } = await apiClient.get('/employee/profile');
      set({ user: data.data });
    } catch (err) {
      if (err.response?.status !== 401) {
        console.warn('Failed to fetch profile', err.message);
      }
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Quietly ignore or warn since local session is cleared anyway
      console.warn('Server session already cleared or expired');
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, role: null, accessToken: null, isAuthenticated: false });
    }
  }
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
