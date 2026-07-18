import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Car, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../features/auth/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const Onboarding = () => {
  const navigate = useNavigate();
  const fetchProfile = useAuthStore(state => state.fetchProfile);
  
  const [role, setRole] = useState('passenger');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mobile) {
      setErrorMsg('Mobile number is required to coordinate commutes');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await apiClient.put('/auth/complete-profile', {
        role,
        mobile,
        department,
        officeLocation
      });

      // Reload user profile in store
      await fetchProfile();
      navigate('/');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete profile onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121113] p-6 text-[#c1c1c1]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-[#121212] border-border p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-primary text-xs uppercase tracking-[0.25em] font-bold">
              <Sparkles size={14} /> Profile Onboarding
            </div>
            <h2 className="text-2xl font-bold text-white">Complete Your Account</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Please choose a default role and verify your mobile number to begin planning commutes.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role selection */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Choose Your Role</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRole('passenger')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2 ${
                    role === 'passenger'
                      ? 'border-primary bg-primary/5 text-white'
                      : 'border-border/60 hover:border-white/20 text-muted-foreground'
                  }`}
                >
                  <User size={24} className={role === 'passenger' ? 'text-primary' : ''} />
                  <span className="text-xs font-bold uppercase tracking-wider">Passenger</span>
                  <span className="text-[10px] text-muted-foreground">Book and join rides</span>
                </div>

                <div
                  onClick={() => setRole('driver')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2 ${
                    role === 'driver'
                      ? 'border-primary bg-primary/5 text-white'
                      : 'border-border/60 hover:border-white/20 text-muted-foreground'
                  }`}
                >
                  <Car size={24} className={role === 'driver' ? 'text-primary' : ''} />
                  <span className="text-xs font-bold uppercase tracking-wider">Driver</span>
                  <span className="text-[10px] text-muted-foreground">Publish and offer rides</span>
                </div>
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Office Hub Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Infocity Campus"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-2.5 font-bold">
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Complete Account Setup
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
