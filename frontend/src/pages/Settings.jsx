import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, CarFront, CreditCard, History, MapPinned, MessagesSquare, HelpCircle, Sparkles, ShieldCheck, BellRing, Loader2 } from 'lucide-react';
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
  const role = useAuthStore((state) => state.role);
  const [vehicles, setVehicles] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [settings, setSettings] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettingsData = async () => {
      setLoading(true);
      setError('');

      try {
        const requests = [
          apiClient.get('/settings'),
          apiClient.get('/payment-methods'),
          apiClient.get('/wallet'),
        ];

        if (role === 'employee') {
          requests.push(apiClient.get('/vehicles'));
          requests.push(apiClient.get('/saved-places'));
        }

        const [settingsResult, paymentResult, walletResult, vehicleResult, placeResult] = await Promise.allSettled(requests);

        if (settingsResult.status === 'fulfilled') setSettings(settingsResult.value.data.data || null);
        if (paymentResult.status === 'fulfilled') setPaymentMethods(paymentResult.value.data.data || []);
        if (walletResult.status === 'fulfilled') setWallet(walletResult.value.data.data || null);
        if (vehicleResult?.status === 'fulfilled') setVehicles(vehicleResult.value.data.data || []);
        if (placeResult?.status === 'fulfilled') setSavedPlaces(placeResult.value.data.data || []);

        const criticalFailure = [settingsResult, paymentResult].find((result) => result.status === 'rejected');
        if (criticalFailure) {
          throw new Error(criticalFailure.reason?.response?.data?.message || criticalFailure.reason?.message || 'Unable to load settings data');
        }

      } catch (loadError) {
        setError(loadError.response?.data?.message || loadError.message || 'Unable to load settings data');
      } finally {
        setLoading(false);
      }
    };

    loadSettingsData();
  }, []);

  const stats = useMemo(() => [
    { label: 'Profile mode', value: settings?.theme || 'default', icon: Sparkles },
    { label: 'Saved places', value: savedPlaces.length, icon: MapPinned },
    { label: 'Vehicles', value: vehicles.length, icon: CarFront },
    { label: 'Wallet balance', value: wallet ? `₹${wallet.wallet?.balance ?? 0}` : '₹0', icon: CreditCard },
    { label: 'Support', value: 'Live', icon: MessagesSquare },
  ], [savedPlaces.length, vehicles.length, wallet, settings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8"
    >
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Card className="bg-[#121212] border-border/70 p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-primary mb-4">Settings</div>
              <div className="space-y-2 text-sm">
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-white font-medium">
                  Central navigation
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quickly access trips, vehicles, wallet tools, saved places, help and support.
                </p>
              </div>
            </Card>
          </div>
        </aside>

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

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="bg-[#121212] border-border/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{item.label}</div>
                      <div className="text-xl font-semibold text-white mt-2">{item.value}</div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Icon size={18} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>

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

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-[#121212] border-border/70">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <CreditCard size={18} className="text-primary" /> Payment Methods
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Supported payment rails and stored payment instruments.</p>
                </div>
                <Link to="/wallet/payment-methods" className="text-sm text-primary font-medium hover:underline">Open</Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 rounded-2xl bg-[#222222]/40 animate-pulse" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-[#222222]/20 p-5 text-sm text-muted-foreground">
                  No payment methods saved.
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.slice(0, 3).map((method) => (
                    <div key={method._id} className="rounded-2xl border border-border/70 bg-[#222222]/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-white">{method.provider}</div>
                          <div className="text-sm text-muted-foreground mt-1">{method.type} • {method.maskedCard || method.token?.slice(-8) || 'stored securely'}</div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                          {method.isDefault ? 'default' : 'saved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="bg-[#121212] border-border/70">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <MessagesSquare size={18} className="text-primary" /> Help and support
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Raise a ticket or jump into live chat support.</p>
                </div>
                <Link to="/help" className="text-sm text-primary font-medium hover:underline">Open</Link>
              </div>

              <div className="space-y-3 text-sm">
                {['FAQs', 'Raise ticket', 'Emergency contact', 'Policy docs'].map((label) => (
                  <div key={label} className="rounded-2xl border border-border/70 bg-[#222222]/20 px-4 py-3 flex items-center justify-between">
                    <span className="text-white">{label}</span>
                    <HelpCircle size={16} className="text-primary" />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-[#121212] border-border/70">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <MapPinned size={18} className="text-primary" /> Saved Places
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Home, office and favorite locations ready for faster bookings.</p>
                </div>
                <Link to="/saved-places" className="text-sm text-primary font-medium hover:underline">Manage</Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-14 rounded-2xl bg-[#222222]/40 animate-pulse" />
                  <div className="h-14 rounded-2xl bg-[#222222]/40 animate-pulse" />
                </div>
              ) : savedPlaces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-[#222222]/20 p-5 text-sm text-muted-foreground">
                  Save your frequently used locations.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlaces.slice(0, 3).map((place) => (
                    <div key={place._id} className="rounded-2xl border border-border/70 bg-[#222222]/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{place.label || place.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{place.location?.address || place.address}</div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Saved</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="bg-[#121212] border-border/70">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <CarFront size={18} className="text-primary" /> My Vehicle
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Review registered vehicles and their current state.</p>
                </div>
                <Link to="/my-vehicle" className="text-sm text-primary font-medium hover:underline">Open</Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 rounded-2xl bg-[#222222]/40 animate-pulse" />
                  <div className="h-16 rounded-2xl bg-[#222222]/40 animate-pulse" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-[#222222]/20 p-5 text-sm text-muted-foreground">
                  No vehicle added. Add your first vehicle.
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.slice(0, 2).map((vehicle) => (
                    <div key={vehicle._id} className="rounded-2xl border border-border/70 bg-[#222222]/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-white">{vehicle.manufacturer ? `${vehicle.manufacturer} ` : ''}{vehicle.model}</div>
                          <div className="text-sm text-muted-foreground mt-1">{vehicle.registrationNumber} • {vehicle.seatingCapacity} seats • {vehicle.fuelType}</div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                          {vehicle.status || 'active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section id="notifications" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="bg-[#121212] border-border/70 xl:col-span-2">
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

            <Card className="bg-[#121212] border-border/70">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Loader2 size={18} className="text-primary animate-spin" /> Quick status
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-border/70 bg-[#222222]/20 px-4 py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Authentication</span>
                  <span className="text-white">Protected</span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-[#222222]/20 px-4 py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Support</span>
                  <span className="text-white">Socket-ready</span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-[#222222]/20 px-4 py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Payments</span>
                  <span className="text-white">Razorpay</span>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </motion.div>
  );
};

export default Settings;