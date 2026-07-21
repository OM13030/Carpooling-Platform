import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, User, Tag, Clock, ArrowRight, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const MyTrips = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [trips, setTrips] = useState([]);
  const [publishedRides, setPublishedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTripsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [tripsRes, ridesRes] = await Promise.allSettled([
        apiClient.get('/trips/history'),
        apiClient.get('/rides/offered')
      ]);

      if (tripsRes.status === 'fulfilled') {
        setTrips(tripsRes.value.data.data || []);
      } else {
        console.error('Failed to fetch trip history', tripsRes.reason);
      }

      if (ridesRes.status === 'fulfilled') {
        setPublishedRides(ridesRes.value.data.data || []);
      } else {
        console.error('Failed to fetch offered rides', ridesRes.reason);
      }
    } catch (err) {
      setError('Unable to load trips data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsData();
  }, []);

  const filteredTrips = trips.filter((t) => {
    if (activeTab === 'upcoming') {
      return t.status === 'scheduled' || t.status === 'active';
    }
    if (activeTab === 'completed') {
      return t.status === 'completed' || t.status === 'payment_completed' || t.status === 'payment_pending';
    }
    if (activeTab === 'cancelled') {
      return t.status === 'cancelled';
    }
    return false;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'completed':
      case 'payment_completed': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Settings
          </Link>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.26em]">
            <Calendar size={14} /> Trips
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">My Trips</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Track and manage your upcoming bookings, published rides, completed travels, and cancelled commutes.
          </p>
        </div>

        <Link to="/find">
          <Button className="min-w-[160px]">
            Book a Ride
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-border/60 mb-6 overflow-x-auto scrollbar-none">
        {['upcoming', 'completed', 'cancelled', 'published'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'border-primary text-white bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
      ) : activeTab === 'published' ? (
        publishedRides.length === 0 ? (
          <Card className="bg-[#121212] border-border/70 p-8 text-center">
            <div className="text-sm font-semibold text-white">No published rides found.</div>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">Create a published ride to start sharing fuel cost with team members.</p>
            <div className="mt-4">
              <Link to="/offer"><Button>Offer a Ride</Button></Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedRides.map((ride) => (
              <Card key={ride._id} className="bg-[#121212] border-border/70 p-5 space-y-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                    Ride ID: {ride._id.slice(-6)}
                  </span>
                  <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-primary mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-semibold">Pickup</span>
                      <span className="text-white">{ride.pickupPoint?.address}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-secondary mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-semibold">Destination</span>
                      <span className="text-white">{ride.destination?.address}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/40 pt-4 font-mono">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Departure</span>
                    <span className="text-white">{ride.departureDate} @ {ride.departureTime}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">Available Seats</span>
                    <span className="text-white">{ride.availableSeats} Seats</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/40 pt-4">
                  <div className="text-xs">
                    <span className="text-muted-foreground block text-[9px] uppercase font-mono">Fare Share</span>
                    <span className="text-white font-bold font-mono">₹{ride.farePerSeat} / Seat</span>
                  </div>
                  <Link to={`/manage-requests/${ride._id}`}>
                    <Button variant="outline" size="sm">Manage Requests</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredTrips.length === 0 ? (
        <Card className="bg-[#121212] border-border/70 p-8 text-center">
          <div className="text-sm font-semibold text-white">No {activeTab} trips found.</div>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">Book your first ride or publish a commute to see it here.</p>
          <div className="mt-4">
            <Link to="/find"><Button>Find Ride</Button></Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrips.map((trip) => (
            <Card key={trip._id} className="bg-[#121212] border-border/70 p-5 space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider border px-2.5 py-0.5 rounded-full ${getStatusColor(trip.status)}`}>
                  {trip.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-primary mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-semibold">Pickup</span>
                    <span className="text-white">{trip.rideId?.pickupPoint?.address || 'Pickup Point'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-secondary mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-semibold">Destination</span>
                    <span className="text-white">{trip.rideId?.destination?.address || 'Destination'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/40 pt-4 font-mono">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Driver / Owner</span>
                  <span className="text-white">{trip.driverId?.name || 'Driver'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Vehicle</span>
                  <span className="text-white">{trip.vehicleId?.manufacturer || ''} {trip.vehicleId?.model || 'Vehicle'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-border/40 pt-4">
                <div className="text-xs">
                  <span className="text-muted-foreground block text-[9px] uppercase font-mono">Fare Paid</span>
                  <span className="text-white font-bold font-mono">₹{trip.distanceKm ? Math.round(trip.distanceKm * 5) : 100}</span>
                </div>
                <Link to={`/trip/${trip._id}`}>
                  <Button variant="primary" size="sm">View Tracking / Details</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyTrips;
