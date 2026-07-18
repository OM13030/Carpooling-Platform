import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Shield, User, Landmark, Leaf, Coins, Car } from 'lucide-react';

export const Login = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const navigate = useNavigate();
  const { loginEmployee, loginAdmin, isAuthenticated, error, loading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    let result;
    if (isAdmin) {
      result = await loginAdmin(email, password);
    } else {
      result = await loginEmployee(email, password);
    }

    if (result.success) {
      navigate(isAdmin ? '/admin' : '/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#121113] text-[#c1c1c1]">
      {/* Left branding panel */}
      <div className="md:w-1/2 bg-[#121212] p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <Car className="text-primary w-6 h-6" />
          </div>
          <span className="font-bold text-lg text-white font-mono tracking-wider">COMMUTE.ENT</span>
        </div>

        <div className="my-12 max-w-lg">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Share rides. <br />
            <span className="text-primary">Offset emissions.</span> <br />
            Empower colleagues.
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The premium enterprise carpooling solution that connects employees, automates routes, reduces operational expenses, and simplifies corporate travel ledger reconciliation.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <Card className="p-4 bg-[#121113]/40 border border-border/60">
              <div className="flex items-center gap-2 text-primary font-bold text-xl font-mono">
                <Leaf size={18} />
                <span>1,240 kg</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">Carbon Offsets Monthly</span>
            </Card>
            <Card className="p-4 bg-[#121113]/40 border border-border/60">
              <div className="flex items-center gap-2 text-primary font-bold text-xl font-mono">
                <Coins size={18} />
                <span>₹42,500</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">Shared Fuel Saved</span>
            </Card>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © 2026 Enterprise Carpooling System. Powered by GraphHopper & Razorpay.
        </div>
      </div>

      {/* Right form panel */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-muted-foreground mt-1">Please sign in to access your platform portal</p>
          </div>

          {/* Toggle Role */}
          <div className="flex bg-[#222222] p-1 rounded-xl mb-6">
            <button
              onClick={() => { setIsAdmin(false); setLocalError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                !isAdmin ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <User size={14} />
              Employee Portal
            </button>
            <button
              onClick={() => { setIsAdmin(true); setLocalError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isAdmin ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Shield size={14} />
              Admin Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Corporate Email</label>
              <input
                type="email"
                placeholder={isAdmin ? "admin@company.com" : "you@company.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            {(localError || error) && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium">
                {localError || error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm font-bold"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {!isAdmin && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              New here?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register as employee
              </Link>{' '}
              or{' '}
              <Link to="/register-org" className="text-primary font-semibold hover:underline">
                Register organization
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
