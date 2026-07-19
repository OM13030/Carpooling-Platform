import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Shield, User, Landmark, Leaf, Coins, Car, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../App';

export const Login = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const navigate = useNavigate();
  const { loginEmployee, loginAdmin, loginGoogle, isAuthenticated, error, loading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

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

  const handleGoogleLogin = async () => {
    setLocalError('');
    const idToken = `mock_Aarav.Sharma`;
    const result = await loginGoogle(idToken);
    if (result.success) {
      if (result.onboardingRequired) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } else {
      setLocalError(result.error || 'Google login failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#121113] text-[#c1c1c1] relative">
      {/* Theme Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-[#222222]/60 hover:bg-[#222222] rounded-xl text-muted-foreground hover:text-white transition-all cursor-pointer border border-border/40 backdrop-blur-sm"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Left branding panel */}
      <div className="md:w-1/2 bg-[#121212] p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <Car className="text-primary w-6 h-6" />
          </div>
          <span className="font-bold text-lg text-white font-mono tracking-wider">GoPool</span>
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

            <div className="flex justify-between items-center text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="rounded bg-[#222222] border-border text-primary focus:ring-primary w-3.5 h-3.5" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline font-semibold">
                Forgot Password?
              </Link>
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

            {!isAdmin && (
              <>
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-border/60 w-full absolute"></div>
                  <span className="bg-[#121113] px-3 text-[10px] text-muted-foreground z-10 uppercase tracking-widest">Or</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 text-xs font-bold flex items-center justify-center gap-2 border-border hover:bg-[#222222]/30 text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.97 1 12 1 7.35 1 3.41 3.67 1.5 7.57l3.92 3.04c.92-2.76 3.5-4.57 6.58-4.57z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"/>
                    <path fill="#FBBC05" d="M5.42 10.61c-.24-.73-.38-1.51-.38-2.31s.14-1.58.38-2.31L1.5 2.95C.54 4.88 0 7.07 0 9.39s.54 4.51 1.5 6.44l3.92-3.04z"/>
                    <path fill="#34A853" d="M12 18.25c-3.08 0-5.66-1.81-6.58-4.57L1.5 16.72c1.91 3.9 5.85 6.57 10.5 6.57 3.19 0 6.07-1.07 8.09-2.91l-3.76-2.91c-1.16.77-2.65 1.25-4.33 1.25z"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
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
