import { create } from 'zustand';
import apiClient from '../../api/apiClient';

export const useAdminStore = create((set, get) => ({
  stats: null,
  employees: [],
  totalEmployees: 0,
  vehicles: [],
  totalVehicles: 0,
  carpoolConfig: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/org/stats');
      set({ stats: data.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch dashboard statistics', loading: false });
    }
  },

  fetchEmployees: async (page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get(`/org/employees?page=${page}&limit=${limit}`);
      set({ 
        employees: data.data.employees,
        totalEmployees: data.data.total,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to fetch employees list', loading: false });
    }
  },

  addEmployee: async (empData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/org/employees', empData);
      set({ loading: false });
      return { success: true, employee: data.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add employee';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  fetchVehicles: async (page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get(`/org/vehicles?page=${page}&limit=${limit}`);
      set({ 
        vehicles: data.data.vehicles,
        totalVehicles: data.data.total,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to fetch vehicles list', loading: false });
    }
  },

  addVehicle: async (vehicleData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/org/vehicles', vehicleData);
      set({ loading: false });
      return { success: true, vehicle: data.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add vehicle';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  toggleEmployeeStatus: async (employeeId, status) => {
    try {
      const { data } = await apiClient.patch(`/org/employees/${employeeId}/status`, { status });
      set((state) => ({
        employees: state.employees.map(emp => emp._id === employeeId ? { ...emp, status } : emp)
      }));
      return { success: true, employee: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update status' };
    }
  },

  fetchCarpoolConfig: async () => {
    try {
      const { data } = await apiClient.get('/org/config');
      set({ carpoolConfig: data.data });
    } catch (err) {
      console.error('Failed to load carpool config', err);
    }
  },

  updateCarpoolConfig: async (config) => {
    try {
      const { data } = await apiClient.patch('/org/config', config);
      set({ carpoolConfig: data.data });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update configuration' };
    }
  }
}));
