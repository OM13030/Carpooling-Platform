import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { useAuthStore } from './features/auth/authStore';
import { useSocket } from './hooks/useSocket';
import { Card } from './components/Card';
import { Button } from './components/Button';
import apiClient from './api/apiClient';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FindRide from './pages/FindRide';
import OfferRide from './pages/OfferRide';
import TripTracking from './pages/TripTracking';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import FeatureModulePage from './pages/FeatureModulePage';
import MyTrips from './pages/MyTrips';
import MyVehicle from './pages/MyVehicle';
import PaymentMethods from './pages/PaymentMethods';
import RideHistory from './pages/RideHistory';
import SavedPlaces from './pages/SavedPlaces';
import HelpCenter from './pages/HelpCenter';
import ChatSupport from './pages/ChatSupport';
import AdminLayout from './components/AdminLayout';

// Icons
import { Bell, Shield, User, Wallet as WalletIcon, LogOut, Landmark, Car, Menu, X, Sun, Moon, LayoutDashboard, Route as RouteIcon, CarFront, Settings as SettingsIcon, FileBarChart2, ChevronDown } from 'lucide-react';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    return { theme: nextTheme };
  })
}));

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const role = useAuthStore(state => state.role);
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return role === 'admin' ? children : <Navigate to="/" replace />;
};

// Global Layout wrapper
const Layout = ({ children }) => {
  const user = useAuthStore(state => state.user);
  const role = useAuthStore(state => state.role);
  const logout = useAuthStore(state => state.logout);
  const fetchProfile = useAuthStore(state => state.fetchProfile);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  // Socket hooks
  const { socket } = useSocket();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await apiClient.get('/misc/notifications');
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.warn('Failed to fetch notifications', err.message);
      }
    }
  };

  useEffect(() => {
    if (user && role === 'employee') {
      fetchNotifications();
      if (!user.name) {
        fetchProfile();
      }
    }
  }, [user, role, fetchProfile]);

  // Hook into real-time request updates
  useEffect(() => {
    if (socket) {
      socket.on('request:received', () => {
        fetchNotifications();
      });
      socket.on('request:status_updated', () => {
        fetchNotifications();
      });
    }
    return () => {
      if (socket) {
        socket.off('request:received');
        socket.off('request:status_updated');
      }
    };
  }, [socket]);

  const handleMarkAsRead = async () => {
    try {
      await apiClient.post('/misc/notifications/read');
      setUnreadCount(0);
      fetchNotifications();
      setShowNotifDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'My Trips', to: '/my-trips', icon: RouteIcon },
    { label: 'Ride History', to: '/ride-history', icon: FileBarChart2 },
    { label: 'My Vehicle', to: '/my-vehicle', icon: CarFront },
    { label: 'Wallet', to: '/wallet', icon: WalletIcon },
    { label: 'Settings', to: '/settings', icon: SettingsIcon },
    { label: 'Report', to: '/report', icon: FileBarChart2 },
  ];

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121113] text-[#c1c1c1]">
      {/* Header bar */}
      <header className="bg-[#121212] border-b border-border/80 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
              <Car className="text-primary w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm tracking-wider font-mono text-white">COMMUTE.ENT</span>
          </Link>
          <nav className="hidden xl:flex items-center gap-1.5 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${active ? 'bg-primary/10 text-white border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-[#222222]/50'}`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-[#222222]/60 rounded-xl text-muted-foreground hover:text-white transition-all cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications bell */}
          {role === 'employee' && (
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 hover:bg-[#222222]/60 rounded-xl text-muted-foreground hover:text-white transition-all relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary live-pulse text-primary"></span>
                )}
              </button>
              
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-[#121212] border border-border shadow-2xl rounded-xl z-50 p-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alerts Desk ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAsRead} 
                        className="text-[9px] text-primary font-bold hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="space-y-3.5 max-h-60 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-[10px] text-muted-foreground">
                        No notifications to show.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className="text-xs border-b border-border/20 pb-2 last:border-0 last:pb-0">
                          <div className="font-bold text-white flex items-center justify-between">
                            {n.title}
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[8px] text-muted-foreground font-mono block mt-1">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin link helper */}
          {role === 'admin' && (
            <Link to="/admin" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <Shield size={14} /> Control Hub
            </Link>
          )}

          {/* Profile Quick Link */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-[#222222]/40 rounded-xl border border-transparent hover:border-border transition-all cursor-pointer"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                {user?.name ? user.name.slice(0, 2) : 'EM'}
              </div>
              <span className="text-xs font-semibold text-white hidden sm:inline truncate max-w-[80px]">{user?.name}</span>
              <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#121212] border border-border shadow-2xl rounded-2xl z-50 p-2">
                <Link
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[#222222]/50 transition-colors"
                >
                  <User size={15} />
                  My Profile
                </Link>
                <Link
                  to="/settings#notifications"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[#222222]/50 transition-colors"
                >
                  <Bell size={15} />
                  Notifications
                </Link>
                <button
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle (Visible only on mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-[#222222]/60 rounded-xl text-muted-foreground hover:text-white transition-all xl:hidden focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="xl:hidden bg-[#121212] border-b border-border/80 px-6 py-4 flex flex-col gap-2 text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${isActiveRoute(item.to) ? 'bg-primary/10 text-white' : 'hover:text-white hover:bg-[#222222]/50'}`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Main body */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export const App = () => {
  const theme = useThemeStore(state => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-org" element={<Register registerOrgOnly={true} />} />

        {/* Private Employee routes */}
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/find" element={<ProtectedRoute><Layout><FindRide /></Layout></ProtectedRoute>} />
        <Route path="/offer" element={<ProtectedRoute><Layout><OfferRide /></Layout></ProtectedRoute>} />
        <Route path="/trip/:tripId" element={<ProtectedRoute><Layout><TripTracking /></Layout></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Layout><Wallet /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/my-trips" element={<ProtectedRoute><Layout><MyTrips /></Layout></ProtectedRoute>} />
        <Route path="/my-vehicle" element={<ProtectedRoute><Layout><MyVehicle /></Layout></ProtectedRoute>} />
        <Route path="/wallet/payment-methods" element={<ProtectedRoute><Layout><PaymentMethods /></Layout></ProtectedRoute>} />
        <Route path="/ride-history" element={<ProtectedRoute><Layout><RideHistory /></Layout></ProtectedRoute>} />
        <Route path="/saved-places" element={<ProtectedRoute><Layout><SavedPlaces /></Layout></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Layout><HelpCenter /></Layout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Layout><ChatSupport /></Layout></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Layout><FeatureModulePage title="Report" subtitle="Quick operational snapshots and exports for your commute activity." accent="Reports" emptyTitle="No reports available." emptyDescription="Generate ride, wallet or vehicle reports from the related modules." actionLabel="View Ride History" actionTo="/ride-history" /></Layout></ProtectedRoute>} />

        {/* Private Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
