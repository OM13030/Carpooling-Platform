import { create } from 'zustand';
import apiClient from '../../api/apiClient';

export const useTripsStore = create((set, get) => ({
  activeTrip: null,
  tripParticipants: [],
  tripMessages: [],
  tripHistory: [],
  loading: false,
  error: null,

  fetchActiveTrip: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/trips/active');
      set({ activeTrip: data.data, loading: false });
      return data.data;
    } catch (err) {
      set({ activeTrip: null, loading: false });
      return null;
    }
  },

  fetchTripDetails: async (tripId) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get(`/trips/${tripId}`);
      set({ 
        activeTrip: data.data.trip, 
        tripParticipants: data.data.participants,
        loading: false 
      });
      return data.data;
    } catch (err) {
      set({ error: 'Failed to fetch trip details', loading: false });
      return null;
    }
  },

  startTrip: async (tripId) => {
    try {
      const { data } = await apiClient.patch(`/trips/${tripId}/start`);
      set({ activeTrip: data.data });
      return { success: true, trip: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to start trip' };
    }
  },

  completeTrip: async (tripId) => {
    try {
      const { data } = await apiClient.patch(`/trips/${tripId}/complete`);
      set({ activeTrip: data.data.trip });
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to complete trip' };
    }
  },

  payPendingFare: async (tripId) => {
    try {
      const { data } = await apiClient.post(`/trips/${tripId}/pay`);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Payment failed' };
    }
  },

  fetchTripHistory: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/trips/history');
      set({ tripHistory: data.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch trip history', loading: false });
    }
  },

  fetchTripMessages: async (tripId) => {
    try {
      const { data } = await apiClient.get(`/misc/chat/${tripId}`);
      set({ tripMessages: data.data });
    } catch (err) {
      console.error('Failed to load chat', err);
    }
  },

  addLocalMessage: (message) => {
    set((state) => ({ tripMessages: [...state.tripMessages, message] }));
  },

  updateLocalLocation: (locationUpdate) => {
    set((state) => {
      if (!state.activeTrip || state.activeTrip._id !== locationUpdate.tripId) return state;
      return {
        activeTrip: {
          ...state.activeTrip,
          currentLocation: {
            type: 'Point',
            coordinates: [locationUpdate.lng, locationUpdate.lat]
          },
          distanceKm: locationUpdate.distanceKm !== undefined ? locationUpdate.distanceKm : state.activeTrip.distanceKm,
          durationMin: locationUpdate.durationMin !== undefined ? locationUpdate.durationMin : state.activeTrip.durationMin,
          locationUpdatedAt: locationUpdate.updatedAt
        }
      };
    });
  }
}));
