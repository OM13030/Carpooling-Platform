import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await apiClient.get(`/auth/verify-email/${token}`);
        setSuccess(true);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Verification link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121113] p-6 text-[#c1c1c1]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#121212] border-border p-6 md:p-8 text-center space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
              <h2 className="text-xl font-semibold text-white">Verifying Email...</h2>
              <p className="text-xs text-muted-foreground">Checking authentication token verification details...</p>
            </div>
          ) : success ? (
            <div className="space-y-4 py-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full mx-auto">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-bold text-white">Email Verified!</h2>
              <p className="text-xs text-muted-foreground">
                Your corporate email address has been successfully verified. You can now login to the platform.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center rounded-full mx-auto">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-xl font-bold text-white">Verification Failed</h2>
              <p className="text-xs text-red-400/80 font-semibold">{errorMsg}</p>
              <p className="text-xs text-muted-foreground">
                The verification link might have expired or been manipulated. Try requesting a new verification link.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full">Back to Login</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
