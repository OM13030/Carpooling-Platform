import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, MapPin, User, Users, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useRidesStore } from '../features/rides/ridesStore';

const RideRequests = () => {
  const { rideId } = useParams();
  const [requests, setRequests] = useState([]);
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const respondToRequest = useRidesStore(state => state.respondToRequest);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [requestsRes, rideRes] = await Promise.all([
        apiClient.get(`/requests/ride/${rideId}`),
        apiClient.get(`/rides/${rideId}`)
      ]);
      setRequests(requestsRes.data.data);
      setRideDetails(rideRes.data.data);
    } catch (err) {
      setError('Failed to load ride requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [rideId]);

  const handleResponse = async (requestId, action) => {
    const res = await respondToRequest(requestId, action);
    if (res.success) {
      // Refresh requests to show updated status
      fetchRequests();
    } else {
      alert(res.error || `Failed to ${action} request`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="mb-6 space-y-2">
        <Link to="/my-trips" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to My Trips
        </Link>
        <h1 className="text-2xl font-semibold text-white">Manage Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review and respond to colleagues requesting to join your commute.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {rideDetails && (
            <Card className="bg-[#121212] border-border/70 p-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                  Ride Settings
                </span>
                <span className="text-xs text-white bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                  {rideDetails.availableSeats} Seats Available
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">From</span>
                  <span className="text-white">{rideDetails.pickupPoint?.address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">To</span>
                  <span className="text-white">{rideDetails.destination?.address}</span>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-border/40 pb-2">
              Pending & Past Requests ({requests.length})
            </h2>

            {requests.length === 0 ? (
              <div className="text-center py-10 bg-[#121212] border border-border/70 rounded-xl">
                <p className="text-sm text-muted-foreground">No requests received yet.</p>
              </div>
            ) : (
              requests.map((req) => (
                <Card key={req._id} className="bg-[#121212] border-border/70 p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary uppercase border border-primary/20">
                        {req.passengerId?.name?.slice(0, 2) || 'US'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{req.passengerId?.name || 'Coworker'}</div>
                        <div className="text-xs text-muted-foreground">{req.passengerId?.email}</div>
                      </div>
                    </div>
                    <div>
                      {req.status === 'pending' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                      {req.status === 'accepted' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full">
                          Accepted
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full">
                          Declined
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#222222]/50 rounded-xl p-3 space-y-2 border border-border/40">
                    <div className="flex items-start gap-2 text-xs">
                      <MapPin size={14} className="text-primary mt-0.5" />
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-semibold">Requested Pickup Point</span>
                        <span className="text-white">{req.pickupPoint?.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users size={14} className="text-secondary" />
                      <span className="text-muted-foreground text-[9px] uppercase font-semibold">Seats Needed:</span>
                      <span className="text-white font-mono font-bold">{req.seatsRequested}</span>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                        onClick={() => handleResponse(req._id, 'reject')}
                      >
                        <X size={16} className="mr-2" /> Decline
                      </Button>
                      <Button 
                        variant="primary" 
                        className="flex-1"
                        onClick={() => handleResponse(req._id, 'accept')}
                      >
                        <Check size={16} className="mr-2" /> Accept Request
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RideRequests;
