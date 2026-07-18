import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Plus, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const PaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [type, setType] = useState('credit_card');
  const [provider, setProvider] = useState('Visa');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/payment-methods');
      setMethods(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let payload = {
        type,
        provider,
        token: `tok_${Math.random().toString(36).substr(2, 9)}`, // Mock Razorpay tokenization
        isDefault: methods.length === 0 // default if it's the first one
      };

      if (type === 'credit_card' || type === 'debit_card') {
        if (cardNumber.length < 16) {
          throw new Error('Please enter a valid 16-digit card number');
        }
        const cleanCardNum = cardNumber.replace(/\s+/g, '');
        payload.lastFourDigits = cleanCardNum.slice(-4);
        payload.maskedCard = `•••• •••• •••• ${payload.lastFourDigits}`;
        const [expMonth, expYear] = expiry.split('/');
        payload.expiryMonth = expMonth?.trim() || '12';
        payload.expiryYear = expYear?.trim() || '30';
      } else if (type === 'upi') {
        if (!upiId.includes('@')) {
          throw new Error('Please enter a valid UPI ID (e.g. user@okaxis)');
        }
        payload.maskedCard = upiId;
        payload.lastFourDigits = upiId.split('@')[0];
        payload.provider = 'UPI';
      } else {
        payload.maskedCard = `${provider} Net Banking`;
        payload.lastFourDigits = 'NET';
      }

      await apiClient.post('/payment-methods', payload);
      setShowAddForm(false);
      setCardNumber('');
      setExpiry('');
      setUpiId('');
      fetchMethods();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await apiClient.delete(`/payment-methods/${id}`);
      fetchMethods();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment method');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await apiClient.patch(`/payment-methods/${id}/default`);
      fetchMethods();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update default payment method');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Settings
          </Link>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.26em]">
            <CreditCard size={14} /> Payments
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Payment Methods</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Manage saved credit cards, debit cards, UPI aliases, and Net Banking logs secured via Razorpay tokens.
          </p>
        </div>

        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="min-w-[160px]">
            <Plus size={16} className="mr-2" />
            Add Payment Method
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Saved Payment Methods List */}
        <div className={showAddForm ? 'lg:col-span-6 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <Card className="bg-[#121212] border-border/70 p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-4">
              <CreditCard size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Saved instruments</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/70 rounded-2xl p-5">
                No payment methods saved. Add a card or UPI alias.
              </div>
            ) : (
              <div className="space-y-3">
                {methods.map((method) => (
                  <div key={method._id} className="flex items-center justify-between p-4 bg-[#222222]/20 border border-border/60 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {method.provider} • <span className="uppercase text-[10px] text-muted-foreground">{method.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {method.maskedCard || 'Stored Securely'}
                      </div>
                      {method.expiryMonth && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Expires: {method.expiryMonth}/{method.expiryYear}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {method.isDefault ? (
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-bold">
                          <ShieldCheck size={12} /> Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(method._id)}
                          className="text-[9px] text-muted-foreground hover:text-white uppercase tracking-wider border border-border/60 hover:border-white px-2 py-1 rounded-full cursor-pointer transition-colors"
                        >
                          Make Default
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(method._id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Add Form */}
        {showAddForm && (
          <div className="lg:col-span-6 space-y-6">
            <Card className="bg-[#121212] border-border/70 p-5">
              <h3 className="font-bold text-sm text-white mb-4">Add Payment Method</h3>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (e.target.value === 'upi') setProvider('UPI');
                      else if (e.target.value === 'net_banking') setProvider('SBI');
                    }}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="upi">UPI ID</option>
                    <option value="net_banking">Net Banking</option>
                  </select>
                </div>

                {(type === 'credit_card' || type === 'debit_card') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Provider</label>
                        <select
                          value={provider}
                          onChange={(e) => setProvider(e.target.value)}
                          className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          <option value="Visa">Visa</option>
                          <option value="Mastercard">Mastercard</option>
                          <option value="RuPay">RuPay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Card Number</label>
                        <input
                          type="text"
                          maxLength="16"
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/30"
                        maxLength="5"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                {type === 'upi' && (
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">UPI ID</label>
                    <input
                      type="text"
                      placeholder="username@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                )}

                {type === 'net_banking' && (
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Bank</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="SBI">State Bank of India</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="Axis">Axis Bank</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                    Save Instrument
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PaymentMethods;
