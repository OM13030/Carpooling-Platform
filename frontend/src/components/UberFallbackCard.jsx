import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { Search, ExternalLink, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../api/apiClient';

export const UberFallbackCard = ({ fallback, pickup, destination }) => {
  const [logging, setLogging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  // Log "shown" impression event on component mount
  useEffect(() => {
    if (!fallback) return;
    const logShown = async () => {
      try {
        await apiClient.post('/analytics/uber-fallback', {
          pickup: {
            lat: pickup.coordinates[1],
            lng: pickup.coordinates[0],
            address: pickup.address
          },
          destination: {
            lat: destination.coordinates[1],
            lng: destination.coordinates[0],
            address: destination.address
          },
          provider: fallback.provider || 'uber',
          action: 'shown'
        });
      } catch (err) {
        console.error('Failed to log fallback shown event', err);
      }
    };
    logShown();
  }, [fallback, pickup, destination]);

  const handleOpenUber = async () => {
    if (!fallback?.deepLink) return;
    
    setLogging(true);
    try {
      // Fire analytics click event log server-side
      await apiClient.post('/analytics/uber-fallback', {
        pickup: {
          lat: pickup.coordinates[1],
          lng: pickup.coordinates[0],
          address: pickup.address
        },
        destination: {
          lat: destination.coordinates[1],
          lng: destination.coordinates[0],
          address: destination.address
        },
        provider: fallback.provider || 'uber',
        action: 'clicked'
      });
    } catch (err) {
      console.error('Failed to log fallback analytics click', err);
    } finally {
      setLogging(false);
      // Open Uber deep link in a new tab
      window.open(fallback.deepLink, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full bg-[#121212] border border-border/80 rounded-2xl p-6 shadow-xl relative overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-2xl"></div>

      <div className="flex flex-col items-center text-center space-y-4">
        {/* Header Warning/Icon */}
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center">
          <Search size={20} className="text-primary animate-pulse" />
        </div>

        <div className="space-y-1 max-w-sm">
          <h3 className="font-extrabold text-sm text-white tracking-tight uppercase tracking-wider">
            🚫 No Carpool Rides Found
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No colleagues are offering rides on your route at this time.
          </p>
        </div>

        <div className="w-full border-t border-border/40 my-2 pt-4">
          <p className="text-xs font-semibold text-white mb-3">
            Want to book a ride with Uber instead?
          </p>

          {/* Styled Uber redirect button with subtle pulse animation */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-full max-w-xs mx-auto"
          >
            <Button
              onClick={handleOpenUber}
              variant="primary"
              className="w-full py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10 active:scale-98 transition-transform"
              disabled={logging || !fallback?.deepLink}
            >
              {logging ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 17.5c-3.04 0-5.5-2.46-5.5-5.5s2.46-5.5 5.5-5.5 5.5 2.46 5.5 5.5-2.46 5.5-5.5 5.5z"/>
                  </svg>
                  Open Uber
                  <ExternalLink size={13} className="ml-1 opacity-80" />
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Informational Warning about Desktop redirects */}
        <div className="bg-[#222222]/40 rounded-xl p-3 border border-border/50 text-[10px] text-muted-foreground max-w-xs text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
            <Info size={12} className="text-primary" />
            <span>Desktop vs. Mobile Behavior</span>
          </div>
          <p className="leading-relaxed">
            Universal deep links are designed to launch the **Uber mobile app** directly with pre-filled coordinates.
          </p>
          <p className="leading-relaxed">
            On desktop web browsers, Uber requires you to log in first, which may strip the pre-filled coordinates during redirect.
          </p>
          
          {/* Debug/Inspect URL section */}
          <div className="pt-2">
            <button
              onClick={() => setShowUrl(!showUrl)}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              {showUrl ? (
                <>Hide Generated Link <ChevronUp size={11} /></>
              ) : (
                <>Inspect Generated Link <ChevronDown size={11} /></>
              )}
            </button>
            
            {showUrl && (
              <div className="mt-1.5 p-2 bg-[#121212] border border-border/60 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-[9px] break-all text-white select-all">
                {fallback?.deepLink}
              </div>
            )}
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground block max-w-xs leading-relaxed">
          * You'll be redirected to complete your booking on the Uber app or website.
        </span>
      </div>
    </motion.div>
  );
};

export default UberFallbackCard;
