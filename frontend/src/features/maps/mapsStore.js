import { create } from 'zustand';
import apiClient from '../../api/apiClient';

export const useMapsStore = create((set, get) => ({
  suggestions: [],
  loading: false,
  error: null,

  searchPlaces: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ suggestions: [] });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get(`/maps/geocode?q=${encodeURIComponent(query)}`);
      set({ suggestions: data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Geocoding failed', loading: false });
    }
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const { data } = await apiClient.get(`/maps/reverse?lat=${lat}&lng=${lng}`);
      return data.data; 
    } catch (err) {
      console.error('Reverse geocoding failed', err);
      return null;
    }
  },

  getRoute: async (fromLat, fromLng, toLat, toLng) => {
    try {
      const { data } = await apiClient.get(`/maps/route?from=${fromLat},${fromLng}&to=${toLat},${toLng}`);
      return data.data; 
    } catch (err) {
      console.error('Routing failed', err);
      return null;
    }
  }
}));
