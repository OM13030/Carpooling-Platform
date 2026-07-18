import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, KeyRound } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await apiClient.post(`/auth/reset-password/${token}`, { password });
      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121113] p-6 text-[#c1c1c1]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#121212] border-border p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center rounded-2xl mx-auto mb-2">
              <KeyRound size={22} />
            </div>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            <p className="text-xs text-muted-foreground">
              Define a strong, secure new password for your enterprise profile.
            </p>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
                />
                <Lock size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
                />
                <Lock size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-2.5 font-bold">
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Reset Password
            </Button>
          </form>

          <div className="text-center border-t border-border/40 pt-4">
            <Link to="/login" className="text-xs text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
