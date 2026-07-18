import { create } from 'zustand';
import apiClient from '../../api/apiClient';

export const useWalletStore = create((set, get) => ({
  wallet: null,
  transactions: [],
  total: 0,
  loading: false,
  error: null,

  fetchWallet: async (page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get(`/wallet?page=${page}&limit=${limit}`);
      set({ 
        wallet: data.data.wallet,
        transactions: data.data.transactions,
        total: data.data.total,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to fetch wallet details', loading: false });
    }
  },

  rechargeWallet: async (amount) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/wallet/recharge', { amount });
      const orderDetails = data.data;
      
      if (orderDetails.isMock) {
        await apiClient.post('/wallet/recharge/mock-complete', { orderId: orderDetails.orderId });
        await get().fetchWallet();
        set({ loading: false });
        return { success: true, message: 'Mock payment succeeded. Wallet recharged!' };
      } else {
        return new Promise((resolve) => {
          const options = {
            key: orderDetails.keyId,
            amount: orderDetails.amount * 100,
            currency: orderDetails.currency,
            name: 'Enterprise Carpooling',
            description: 'Wallet Balance Recharge',
            order_id: orderDetails.orderId,
            handler: async (response) => {
              try {
                await apiClient.post('/wallet/recharge/mock-complete', { orderId: orderDetails.orderId });
                await get().fetchWallet();
                resolve({ success: true });
              } catch (err) {
                resolve({ success: false, error: 'Recharge confirmation failed' });
              }
            },
            prefill: {
              name: 'Employee',
              email: 'employee@odooksv.com'
            },
            theme: {
              color: '#d87943'
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          set({ loading: false });
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Recharge request failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  }
}));
