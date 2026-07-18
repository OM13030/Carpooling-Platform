import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { useTripsStore } from '../features/trips/tripsStore';
import { useRidesStore } from '../features/rides/ridesStore';
import { useWalletStore } from '../features/wallet/walletStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LiveBadge } from '../components/LiveBadge';
import { Car, Search, Wallet, User, Leaf, ArrowRight, Navigation, Plus, MessageSquare } from 'lucide-react';
import apiClient from '../api/apiClient';

export const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { activeTrip, fetchActiveTrip, fetchTripHistory, tripHistory } = useTripsStore();
  const { fetchMyOfferedRides, myOfferedRides } = useRidesStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [personalStats, setPersonalStats] = useState({ carbon: 0, distance: 0, costSaved: 0 });

  useEffect(() => {
    fetchActiveTrip();
    fetchTripHistory();
    fetchMyOfferedRides();
    fetchWallet();
  }, [fetchActiveTrip, fetchTripHistory, fetchMyOfferedRides, fetchWallet]);

  useEffect(() => {
    if (tripHistory.length > 0) {
      let carbon = 0;
      let distance = 0;
      let costSaved = 0;

      tripHistory.forEach(trip => {
        if (trip.status === 'payment_completed' || trip.status === 'completed') {
          carbon += (trip.carbonSavedKg || 0);
          distance += (trip.distanceKm || 0);
          costSaved += (trip.fare || 0); // Money kept/saved
        }
      });

      setPersonalStats({
        carbon: parseFloat(carbon.toFixed(1)),
        distance: parseFloat(distance.toFixed(1)),
        costSaved: Math.round(costSaved)
      });
    }
  }, [tripHistory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Profile Actions */}
      <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary uppercase">
            {user?.name ? user.name.slice(0, 2) : 'EM'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Hello, {user?.name || 'Employee'}</h1>
            <p className="text-xs text-muted-foreground">{user?.designation || 'Corporate Member'} • {user?.department || 'Odoo KSV'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <User size={16} />
            Profile
          </Button>
          <Button variant="ghost" onClick={logout} className="text-xs text-red-400 hover:bg-red-500/10">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Active Trip Banner */}
      {activeTrip && (
        <Card className="mb-8 border-primary/40 bg-primary/5 hover:border-primary/60 transition-colors animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LiveBadge label="ACTIVE TRIP" />
              <div>
                <h3 className="font-bold text-sm text-white">Your carpool trip is in progress</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Route: {activeTrip.startTime ? 'Started' : 'Scheduled'} • Click tracking to open live maps & chat</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => navigate(`/trip/${activeTrip._id}`)} className="text-xs">
              Track Live Route
              <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      )}

      {/* Impact Stats counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center gap-4 bg-emerald-500/5 border-emerald-500/20">
          <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Leaf size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">CO₂ Carbon Saved</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5 block">{personalStats.carbon} kg</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-primary/5 border-primary/20">
          <div className="bg-primary/10 p-3.5 rounded-xl border border-primary/20 text-primary">
            <Navigation size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Total Share Mileage</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5 block">{personalStats.distance} km</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-[#222222]/20 border-border">
          <div className="bg-[#222222]/40 p-3.5 rounded-xl border border-border text-muted-foreground">
            <Wallet size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Wallet Balance</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white font-mono">₹{wallet?.balance || 0}</span>
              <Link to="/wallet" className="text-xs text-primary font-semibold hover:underline">Manage</Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Action tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card onClick={() => navigate('/find')} className="flex items-start gap-4 cursor-pointer">
          <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 text-primary mt-1">
            <Search size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">Find a Ride</h3>
            <p className="text-sm text-muted-foreground mt-1">Search active colleagues commuting to your work hub. Book seat slots instantly.</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-primary font-bold">
              Find commutes now <ArrowRight size={12} />
            </div>
          </div>
        </Card>

        <Card onClick={() => navigate('/offer')} className="flex items-start gap-4 cursor-pointer">
          <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20 text-secondary mt-1">
            <Plus size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">Offer a Ride</h3>
            <p className="text-sm text-muted-foreground mt-1">Publish an upcoming route driving your own vehicle. Coordinate colleagues, share fuel costs.</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-secondary font-bold">
              Post a commute route <ArrowRight size={12} />
            </div>
          </div>
        </Card>
      </div>

      {/* Commutes Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Offers */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Car size={18} className="text-primary" />
            My Offered Commutes
          </h2>
          {myOfferedRides.length === 0 ? (
            <Card className="text-center py-8 text-sm text-muted-foreground bg-[#121212]/40">
              No offered commutes found. Tap 'Offer a Ride' to publish one.
            </Card>
          ) : (
            <div className="space-y-4">
              {myOfferedRides.slice(0, 3).map(ride => (
                <Card key={ride._id} className="hover:border-primary/20 bg-[#121212]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">{new Date(ride.departureDate).toLocaleDateString()} at {ride.departureTime}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      ride.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white truncate">To: {ride.destination.address}</div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">Seats: {ride.occupiedSeats}/{ride.availableSeats + ride.occupiedSeats} filled</span>
                    <span className="font-bold text-white">Fare per seat: ₹{ride.farePerSeat}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent History */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Navigation size={18} className="text-primary" />
            Recent Trip History
          </h2>
          {tripHistory.length === 0 ? (
            <Card className="text-center py-8 text-sm text-muted-foreground bg-[#121212]/40">
              No recent trips recorded.
            </Card>
          ) : (
            <div className="space-y-4">
              {tripHistory.slice(0, 3).map(trip => {
                const isDriver = user && trip.driverId && (trip.driverId._id || trip.driverId) === user._id;
                return (
                  <Card key={trip._id} className="bg-[#121212]/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-mono">{new Date(trip.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        trip.status === 'payment_completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'
                      }`}>
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-white truncate max-w-[200px]">
                        Role: {isDriver ? 'Driver' : 'Passenger'}
                      </div>
                      <span className="font-bold text-white text-sm">₹{trip.fare}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                      <span>Distance: {trip.distanceKm || 0} km</span>
                      <span className="text-emerald-400 font-medium">CO₂ Saved: {trip.carbonSavedKg || 0} kg</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
