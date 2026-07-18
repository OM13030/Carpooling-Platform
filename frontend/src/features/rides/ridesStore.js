import { create } from 'zustand';
import apiClient from '../../api/apiClient';

export const useRidesStore = create((set, get) => ({
  rides: [],
  myOfferedRides: [],
  myRequests: [],
  currentRide: null,
  loading: false,
  error: null,

  publishRide: async (rideData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/rides', rideData);
      set({ loading: false });
      return { success: true, ride: data.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to offer ride';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  searchRides: async (searchParams) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams(searchParams).toString();
      const { data } = await apiClient.get(`/rides/search?${query}`);
      set({ rides: data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to search rides', loading: false });
    }
  },

  fetchMyOfferedRides: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/rides/offered');
      set({ myOfferedRides: data.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch offered rides', loading: false });
    }
  },

  fetchRideDetails: async (rideId) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get(`/rides/${rideId}`);
      set({ currentRide: data.data, loading: false });
      return data.data;
    } catch (err) {
      set({ error: 'Failed to fetch ride details', loading: false });
      return null;
    }
  },

  sendRideRequest: async (requestData) => {
    try {
      const { data } = await apiClient.post('/requests', requestData);
      return { success: true, request: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Request failed' };
    }
  },

  fetchMyRequests: async () => {
    try {
      const { data } = await apiClient.get('/requests/my-requests');
      set({ myRequests: data.data });
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  },

  respondToRequest: async (requestId, action) => { 
    try {
      const { data } = await apiClient.patch(`/requests/${requestId}/${action}`);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Action failed' };
    }
  }
}));
