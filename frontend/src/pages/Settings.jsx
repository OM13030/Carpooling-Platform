import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, CarFront, CreditCard, History, MapPinned, MessagesSquare, HelpCircle, Sparkles, ShieldCheck, BellRing } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SettingCard } from '../components/SettingCard';
import { useAuthStore } from '../features/auth/authStore';

const quickActions = [
  { to: '/my-trips', icon: CalendarDays, title: 'My Trips', description: 'View rides you have booked or published.', badge: 'Trips' },
  { to: '/my-vehicle', icon: CarFront, title: 'My Vehicle', description: 'Manage your registered vehicles.', badge: 'Fleet' },
  { to: '/wallet/payment-methods', icon: CreditCard, title: 'Payment Methods', description: 'Manage saved cards, UPI and Razorpay.', badge: 'Wallet' },
  { to: '/ride-history', icon: History, title: 'Ride History', description: 'Review completed and cancelled rides.', badge: 'History' },
  { to: '/saved-places', icon: MapPinned, title: 'Saved Places', description: 'Save Home, Office and favorite destinations.', badge: 'Places' },
  { to: '/help', icon: HelpCircle, title: 'Help Center', description: 'FAQs, support tickets and platform guidance.', badge: 'Help' },
  { to: '/chat', icon: MessagesSquare, title: 'Chat Support', description: 'Talk directly with customer support.', badge: 'Live' },
];

const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettingsData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiClient.get('/settings');
        setSettings(result.data.data || null);
      } catch (loadError) {
        setError(loadError.response?.data?.message || loadError.message || 'Unable to load settings data');
      } finally {
        setLoading(false);
      }
    };
    loadSettingsData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8"
    >
      <main className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back
              </Link>
              <h1 className="text-2xl md:text-3xl font-semibold text-white">Settings</h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Manage the most frequently used modules from one place. This view keeps trips, wallet, vehicles, locations and support within a single, focused workflow.
              </p>
              {settings?.notificationPreferences ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(settings.notificationPreferences).map(([key, value]) => (
                    <span key={key} className="text-[10px] uppercase tracking-[0.2em] rounded-full border border-border/70 bg-[#121212] px-2.5 py-1 text-muted-foreground">
                      {key}: {value ? 'on' : 'off'}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-[#121212] px-4 py-3">
              <Sparkles size={16} className="text-primary" />
              <span className="text-sm text-white">Welcome back, {user?.name || 'there'}</span>
            </div>
          </div>



          {error ? (
            <Card className="bg-[#121212] border-red-500/20 text-red-300">
              <div className="flex items-center gap-3 justify-between flex-wrap">
                <div>
                  <div className="font-semibold">Unable to load settings data</div>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </Card>
          ) : null}

          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {quickActions.map((item) => (
                <SettingCard key={item.to} {...item} />
              ))}
            </div>
          </section>



          <section id="notifications" className="grid grid-cols-1 gap-6">
            <Card className="bg-[#121212] border-border/70">
              <div className="flex items-center gap-2 text-white font-semibold">
                <BellRing size={18} className="text-primary" /> Notification preferences
              </div>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Keep trip updates, payment alerts and support notifications grouped in a single place. This section is ready for a settings API response.
              </p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Trip alerts', 'Payment receipts', 'Support responses', 'Admin broadcasts'].map((label) => (
                  <div key={label} className="rounded-2xl border border-border/70 bg-[#222222]/20 px-4 py-3 text-sm text-white flex items-center justify-between">
                    <span>{label}</span>
                    <ShieldCheck size={16} className="text-primary" />
                  </div>
                ))}
              </div>
            </Card>


          </section>
      </main>
    </motion.div>
  );
};

export default Settings;