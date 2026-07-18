import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { Shield, Bell, LogOut, ChevronDown, Car } from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121113] text-[#c1c1c1]">
      {/* Admin Top Header */}
      <header className="bg-[#121212] border-b border-border/80 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
              <Shield className="text-primary w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm tracking-wider font-mono text-white">COMMUTE.ADMIN</span>
          </Link>
          <span className="text-xs bg-[#222222] border border-border/70 px-2.5 py-1 rounded-full text-muted-foreground font-mono">
            Control Hub
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications bell */}
          <button className="p-2 hover:bg-[#222222]/60 rounded-xl text-muted-foreground hover:text-white transition-all relative cursor-pointer">
            <Bell size={18} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-[#222222]/40 rounded-xl border border-transparent hover:border-border transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                AD
              </div>
              <span className="text-xs font-semibold text-white hidden sm:inline truncate max-w-[80px]">Admin</span>
              <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#121212] border border-border shadow-2xl rounded-2xl z-50 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
