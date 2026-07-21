import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Star, Loader2, Search } from 'lucide-react';
import { UberFallbackCard } from './UberFallbackCard';

export const RideSearchResults = ({
  searchState,
  pickup,
  destination,
  onBookRide,
  isSearchingNearby,
  searchTimer,
  setIsSearchingNearby,
  setSearchTimer,
  currentUser
}) => {
  const { data, isLoading, error } = searchState;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse bg-[#222222]/30 border-border p-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-accent rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-accent rounded-md w-1/4"></div>
                <div className="h-3 bg-accent rounded-md w-3/4"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8 text-red-400 bg-red-500/5 border border-red-500/20">
        <div className="text-xs font-semibold">{error}</div>
        <p className="text-[10px] text-muted-foreground mt-1">Failed to query matching rides. Please try again.</p>
      </Card>
    );
  }

  if (!data) return null;

  const hasRides = data.status === 'found' && data.rides?.length > 0;

  if (!hasRides) {
    if (isSearchingNearby) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 bg-[#222222]/10 rounded-2xl border border-border/40">
          {/* Pulsing Radar Animation */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary/20 opacity-30 animate-ping"></span>
            <span className="absolute inline-flex h-12 w-12 rounded-full bg-primary/30 opacity-40 animate-ping"></span>
            <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary relative z-10 shadow-lg shadow-primary/10">
              <Search size={16} className="animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">Finding Rides Nearby You...</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
              We are searching for active colleagues driving on your route. Please keep this page open.
            </p>
          </div>

          <div className="bg-[#222222] border border-border rounded-xl py-2 px-5 font-mono font-bold text-base text-primary tracking-widest shadow-inner">
            {formatTime(searchTimer)}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setIsSearchingNearby(false);
              setSearchTimer(0);
            }}
            className="text-[10px] py-1 px-3 cursor-pointer"
          >
            Cancel Search
          </Button>
        </div>
      );
    }

    // When countdown completes or search is cancelled, offer Uber fallback
    return (
      <UberFallbackCard
        fallback={data.fallback}
        pickup={pickup}
        destination={destination}
      />
    );
  }

  // Matching Carpool rides list found
  return (
    <div className="space-y-4">
      {data.rides.map((ride) => {
        const isDriverMe = currentUser && ride.driverId && (ride.driverId._id || ride.driverId) === currentUser._id;
        return (
          <Card key={ride._id} className="bg-[#222222]/30 border-border hover:border-primary/20 p-4 transition-all">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary uppercase overflow-hidden">
                  {ride.driver.profilePhotoUrl ? (
                    <img src={ride.driver.profilePhotoUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    ride.driver.name.slice(0, 2)
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {ride.driver.name}
                    <span className="text-[10px] font-semibold text-muted-foreground bg-[#222222] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      {ride.vehicle?.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= Math.round(ride.driver.ratingAvg || 0) ? 'text-primary fill-primary' : 'text-muted-foreground/40'}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">({ride.driver.ratingCount} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-lg font-extrabold text-white font-mono">₹{ride.farePerSeat}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 uppercase tracking-wider">Per Seat</span>
              </div>
            </div>

            <div className="border-t border-border/40 my-3 pt-3 text-[11px] space-y-1.5 text-muted-foreground">
              <div>Pickup: <span className="text-white">{ride.pickupPoint.address}</span></div>
              <div>Destination: <span className="text-white">{ride.destination.address}</span></div>
            </div>

            {ride.explanation && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 text-[10px] text-primary mb-3">
                {ride.explanation}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-xs text-muted-foreground font-semibold">
                Available: {ride.availableSeats} seat(s) left
              </span>
              
              {isDriverMe ? (
                <span className="text-xs text-muted-foreground italic">You are the driver</span>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={() => onBookRide(ride)} 
                  className="text-xs py-1.5 px-3"
                >
                  Book Seat
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RideSearchResults;
