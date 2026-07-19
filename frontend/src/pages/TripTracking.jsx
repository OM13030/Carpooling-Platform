import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripsStore } from '../features/trips/tripsStore';
import { useAuthStore } from '../features/auth/authStore';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { Stepper } from '../components/Stepper';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MapView } from '../components/MapView';
import { LiveBadge } from '../components/LiveBadge';
import { Send, MessageSquare, Phone, Navigation, AlertTriangle, Star, CheckCircle } from 'lucide-react';
import apiClient from '../api/apiClient';

export const TripTracking = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const {
    activeTrip,
    tripParticipants,
    tripMessages,
    fetchTripDetails,
    startTrip,
    completeTrip,
    payPendingFare,
    fetchTripMessages,
    addLocalMessage
  } = useTripsStore();

  const { joinTrip, sendLocation, sendMessage, socket } = useSocket();
  const { watchLocation } = useGeolocation();

  // Watch ID reference for driver GPS tracker
  const gpsWatchIdRef = useRef(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Review state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Load details & join rooms
  useEffect(() => {
    fetchTripDetails(tripId);
    fetchTripMessages(tripId);
    joinTrip(tripId);
  }, [tripId, fetchTripDetails, fetchTripMessages]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tripMessages]);

  const isDriver = activeTrip && user && (activeTrip.driverId._id || activeTrip.driverId) === user._id;

  // Location watching for Driver
  useEffect(() => {
    if (!activeTrip || !isDriver) return;

    // Start watching if trip is started or in progress
    if (['started', 'in_progress'].includes(activeTrip.status)) {
      if (!gpsWatchIdRef.current) {
        console.log('Driver: Starting GPS coordinate broadcaster...');
        gpsWatchIdRef.current = watchLocation((coords) => {
          sendLocation(activeTrip._id, coords.lat, coords.lng);
        });
      }
    } else {
      // Clear watcher if trip completed or cancelled
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    }

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, [activeTrip, isDriver, watchLocation, sendLocation]);

  // Listen to request completion/rating triggers
  useEffect(() => {
    if (activeTrip && (activeTrip.status === 'completed' || activeTrip.status === 'payment_pending' || activeTrip.status === 'payment_completed')) {
      // Show rating form for completed trips if not already rated
      const hasRated = localStorage.getItem(`rated_${tripId}`);
      if (!hasRated && !isDriver) {
        setShowRatingModal(true);
      }
    }
  }, [activeTrip, tripId, isDriver]);

  const handleStart = async () => {
    const res = await startTrip(tripId);
    if (res.success) {
      // Trigger instant location broadcast
      navigator.geolocation.getCurrentPosition((pos) => {
        sendLocation(tripId, pos.coords.latitude, pos.coords.longitude);
      });
    }
  };

  const handleComplete = async () => {
    await completeTrip(tripId);
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  };

  const handlePay = async () => {
    const res = await payPendingFare(tripId);
    if (res.success) {
      fetchTripDetails(tripId);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sendMessage(tripId, chatInput.trim());
    setChatInput('');
  };

  const submitRating = async () => {
    try {
      const driverId = activeTrip.driverId._id || activeTrip.driverId;
      await apiClient.post('/misc/ratings', {
        tripId,
        toEmployeeId: driverId,
        score: ratingScore,
        comment: ratingComment
      });
      localStorage.setItem(`rated_${tripId}`, 'true');
      setRatingSubmitted(true);
      setTimeout(() => setShowRatingModal(false), 2000);
    } catch (err) {
      console.error('Rating failed', err);
    }
  };

  if (!activeTrip) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-muted-foreground animate-pulse">
        Loading active trip tracking data...
      </div>
    );
  }

  // Find passenger specific record
  const passengerDetails = tripParticipants.find(p => p.role === 'passenger' && (p.employeeId._id || p.employeeId) === user._id);
  // Find other passenger details to show
  const coPassengers = tripParticipants.filter(p => p.role === 'passenger');

  // Route path coordinates from Ride destination and currentLocation
  const pickupPoint = activeTrip.rideId?.pickupPoint;
  const destinationPoint = activeTrip.rideId?.destination;
  const vehicleCoordinates = activeTrip.currentLocation?.coordinates;
  const vehicleLoc = vehicleCoordinates ? [vehicleCoordinates[1], vehicleCoordinates[0]] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Trip Tracking</h1>
            <LiveBadge label={activeTrip.status.toUpperCase().replace('_', ' ')} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">GIFT City Commute Route • Trip Code: {activeTrip._id.slice(-6)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Dynamic ETA</span>
            <span className="font-bold text-white font-mono text-sm">
              {activeTrip.durationMin > 0 ? `${activeTrip.durationMin} mins remaining` : 'Arrived at dropoff'}
            </span>
          </div>
        </div>
      </div>

      {/* Stepper component */}
      <Card className="mb-6 bg-[#121212] border-border">
        <Stepper currentStatus={activeTrip.status} />
      </Card>

      {/* Split layout: Map vs Sidebar Details */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map Panel */}
        <div className="flex-1">
          <MapView
            pickup={pickupPoint}
            destination={destinationPoint}
            vehicleLoc={vehicleLoc}
            routePoints={activeTrip.routePoints}
            height="450px"
          />
        </div>

        {/* Sidebar Info & Chats */}
        <div className="lg:w-[35%] flex flex-col gap-6">
          {/* Pickup Coordination Card (Persistent Chat + Call Rework) */}
          <Card className="bg-[#121212] border-border p-4">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-3">
              Pickup Coordination
            </h3>
            
            {isDriver ? (
              <div className="space-y-3">
                <span className="text-[10px] text-muted-foreground block">
                  Passenger Contact List:
                </span>
                {coPassengers.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">No passengers joined yet.</span>
                ) : (
                  <div className="space-y-2.5">
                    {coPassengers.map((p, i) => {
                      const emp = p.employeeId || {};
                      return (
                        <div key={i} className="flex items-center justify-between bg-[#222222]/30 p-2.5 rounded-xl border border-border/60">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                              {emp.name?.slice(0, 2) || 'PA'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{emp.name || 'Passenger'}</div>
                              <div className="text-[9px] text-muted-foreground">{emp.mobile || 'No Mobile'}</div>
                            </div>
                          </div>
                          {emp.mobile && (
                            <a
                              href={`tel:${emp.mobile}`}
                              className="bg-primary/20 border border-primary/40 text-primary p-2 rounded-lg hover:bg-primary/30 transition-colors"
                              title={`Call ${emp.name}`}
                            >
                              <Phone size={13} className="fill-current text-primary" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#222222]/30 p-2.5 rounded-xl border border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                      {activeTrip.driverId?.name?.slice(0, 2) || 'DR'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Driver: {activeTrip.driverId?.name || 'Coworker'}</div>
                      <div className="text-[9px] text-muted-foreground">{activeTrip.driverId?.mobile || 'No Mobile'}</div>
                    </div>
                  </div>
                  {activeTrip.driverId?.mobile && (
                    <a
                      href={`tel:${activeTrip.driverId.mobile}`}
                      className="bg-primary/20 border border-primary/40 text-primary p-2 rounded-lg hover:bg-primary/30 transition-colors"
                      title="Call Driver"
                    >
                      <Phone size={13} className="fill-current text-primary" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quick Chat Triggers */}
            <div className="mt-4 pt-3 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground block mb-2 font-medium">
                Tap to Send Quick Message:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "I'm at the gate",
                  "Running 2 min late",
                  "Reached pickup point",
                  "I'm here!"
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => {
                      sendMessage(activeTrip._id, txt);
                    }}
                    className="bg-[#222222] hover:bg-[#333333] border border-border/60 text-muted-foreground hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Stepper Controls Card */}
          <Card className="bg-[#121212] border-border">
            <h3 className="font-bold text-sm text-white mb-3">Trip Actions</h3>
            {isDriver ? (
              <div className="space-y-3">
                {activeTrip.status === 'booked' && (
                  <Button variant="primary" onClick={handleStart} className="w-full py-2.5 font-bold">
                    Start Commute
                  </Button>
                )}
                {['started', 'in_progress'].includes(activeTrip.status) && (
                  <Button variant="destructive" onClick={handleComplete} className="w-full py-2.5 font-bold">
                    End Commute & Payout Fares
                  </Button>
                )}
                {activeTrip.status === 'payment_pending' && (
                  <div className="text-xs text-muted-foreground bg-[#222222]/30 p-3.5 border border-border rounded-xl">
                    Trip completed. Waiting for passenger wallet settlements.
                  </div>
                )}
                {activeTrip.status === 'payment_completed' && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/5 p-3.5 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} />
                    Trip complete. Fares successfully settled to your wallet!
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activeTrip.status === 'booked' && (
                  <div className="text-xs text-muted-foreground bg-[#222222]/30 p-3.5 border border-border rounded-xl">
                    Waiting for driver to start the route...
                  </div>
                )}
                {['started', 'in_progress'].includes(activeTrip.status) && (
                  <div className="text-xs text-primary bg-primary/5 p-3.5 border border-primary/20 rounded-xl animate-pulse">
                    On road. Driver is driving.
                  </div>
                )}
                {activeTrip.status === 'payment_pending' && passengerDetails && passengerDetails.paymentStatus === 'pending' && (
                  <div className="space-y-3">
                    <div className="text-xs text-red-400 bg-red-500/5 p-3.5 border border-red-500/20 rounded-xl flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>Action required: Insufficient balance or pending fare of ₹{passengerDetails.fareShare}.</span>
                    </div>
                    <Button variant="primary" onClick={handlePay} className="w-full font-bold py-2.5">
                      Pay ₹{passengerDetails.fareShare} Fare Now
                    </Button>
                  </div>
                )}
                {passengerDetails && passengerDetails.paymentStatus === 'completed' && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/5 p-3.5 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} />
                    Payment verified. Payout of ₹{passengerDetails.fareShare} successfully settled.
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Chat Pane */}
          <Card className="bg-[#121212] border-border flex flex-col h-[320px]">
            <div className="p-2 border-b border-border/40 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Trip Chat Room</span>
              <MessageSquare size={14} className="text-muted-foreground" />
            </div>
            
            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
              {tripMessages.map((msg) => {
                const isMe = user && (msg.senderId._id || msg.senderId) === user._id;
                const senderName = msg.senderId.name || 'User';
                
                return (
                  <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-muted-foreground mb-0.5">{senderName}</span>
                    <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                      isMe 
                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none' 
                        : 'bg-[#222222] text-foreground rounded-tl-none border border-border/60'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-border/40 flex gap-2">
              <input
                type="text"
                placeholder="Message colleagues..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </form>
          </Card>
        </div>
      </div>

      {/* Review & Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-[#121212] border-border shadow-2xl relative p-6">
            <h3 className="font-bold text-base text-white">Rate Your Driver</h3>
            <p className="text-xs text-muted-foreground mt-1">Provide feedback on your commute with {activeTrip.driverId.name}</p>

            {ratingSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold my-6 flex items-center gap-2">
                <CheckCircle size={16} />
                Thank you! Rating details updated.
              </div>
            ) : (
              <div className="space-y-4 my-6">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Score Selection</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setRatingScore(score)}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                          ratingScore === score 
                            ? 'bg-primary text-primary-foreground border-primary font-bold' 
                            : 'bg-transparent border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {score} <Star size={12} className="ml-0.5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Comments (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Safe driving, on time, pleasant experience..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowRatingModal(false)}>Skip</Button>
                  <Button variant="primary" className="flex-1" onClick={submitRating}>Submit Feedback</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default TripTracking;
