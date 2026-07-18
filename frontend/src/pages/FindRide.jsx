import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRidesStore } from '../features/rides/ridesStore';
import { useMapsStore } from '../features/maps/mapsStore';
import { useAuthStore } from '../features/auth/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MapView } from '../components/MapView';
import { Star, MapPin, Search, Calendar, Clock, User, MessageSquare, ShieldAlert, BadgeAlert, Navigation } from 'lucide-react';

export const FindRide = () => {
  const navigate = useNavigate();
  const searchRides = useRidesStore(state => state.searchRides);
  const sendRideRequest = useRidesStore(state => state.sendRideRequest);
  const rides = useRidesStore(state => state.rides);
  const loading = useRidesStore(state => state.loading);
  const error = useRidesStore(state => state.error);

  const { searchPlaces, reverseGeocode } = useMapsStore();
  const user = useAuthStore(state => state.user);

  // Search input state
  const [pickupInput, setPickupInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [pickupPoint, setPickupPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('09:00');

  // Autocomplete dropdown UI helper state
  const [suggestions, setSuggestions] = useState([]);
  const [activePicker, setActivePicker] = useState(null); // 'pickup' or 'destination'
  const [locating, setLocating] = useState(null); // 'pickup' or 'destination' or null
  const debounceTimer = useRef(null);

  const handleLocateMe = (type) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(type);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await reverseGeocode(latitude, longitude);
          if (res) {
            const geo = {
              address: res.address,
              type: 'Point',
              coordinates: [longitude, latitude]
            };
            if (type === 'pickup') {
              setPickupPoint(geo);
              setPickupInput(geo.address);
            } else {
              setDestinationPoint(geo);
              setDestInput(geo.address);
            }
            setSuggestions([]);
            setActivePicker(null);
          } else {
            alert('Failed to resolve current location address.');
          }
        } catch (err) {
          console.error(err);
          alert('Error reverse geocoding location.');
        } finally {
          setLocating(null);
        }
      },
      (err) => {
        console.error(err);
        alert(`Failed to get location: ${err.message}`);
        setLocating(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Handle Autocomplete debouncing
  const handleQueryChange = (val, type) => {
    if (type === 'pickup') {
      setPickupInput(val);
    } else {
      setDestInput(val);
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (val.trim().length >= 2) {
        setActivePicker(type);
        try {
          const hits = await searchPlaces(val);
          // retrieve suggestions from mapsStore state
          const storeSuggestions = useMapsStore.getState().suggestions;
          setSuggestions(storeSuggestions);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
  };

  const selectSuggestion = (item, type) => {
    const geo = {
      address: item.address || item.name,
      type: 'Point',
      coordinates: [item.lng, item.lat] // [lng, lat]
    };

    if (type === 'pickup') {
      setPickupPoint(geo);
      setPickupInput(geo.address);
    } else {
      setDestinationPoint(geo);
      setDestInput(geo.address);
    }
    setSuggestions([]);
    setActivePicker(null);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!pickupPoint || !destinationPoint) return;

    searchRides({
      pickupLng: pickupPoint.coordinates[0],
      pickupLat: pickupPoint.coordinates[1],
      destLng: destinationPoint.coordinates[0],
      destLat: destinationPoint.coordinates[1],
      departureDate: `${departureDate}T${departureTime}:00`
    });
  };

  const openBookingModal = (ride) => {
    setSelectedRide(ride);
    setSeatsRequested(1);
    setBookingSuccess('');
    setBookingError('');
    setIsModalOpen(true);
  };

  const submitBookingRequest = async () => {
    if (!selectedRide) return;
    setBookingError('');
    setBookingSuccess('');

    const res = await sendRideRequest({
      rideId: selectedRide._id,
      seatsRequested,
      pickupPoint: pickupPoint // prefill search pickup point as default
    });

    if (res.success) {
      setBookingSuccess('Booking request sent successfully! Colleague notified.');
      setTimeout(() => {
        setIsModalOpen(false);
        // refresh list
        handleSearch();
      }, 2000);
    } else {
      setBookingError(res.error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const avg = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i <= avg ? 'text-primary fill-primary' : 'text-muted-foreground'}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Find a Ride</h1>
        <p className="text-sm text-muted-foreground mt-1">Book a commute seat offered by verified coworkers in your company</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Inputs & Search Results */}
        <div className="flex-1 space-y-6">
          {/* Search Card Form */}
          <Card className="bg-[#121212] border-border">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {/* Pickup Field */}
                <div className="relative">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Pickup Location *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Type pickup area..."
                      value={pickupInput}
                      onChange={(e) => handleQueryChange(e.target.value, 'pickup')}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleLocateMe('pickup')}
                      title="Use current location"
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                      disabled={locating !== null}
                    >
                      {locating === 'pickup' ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation size={14} className="rotate-45" />
                      )}
                    </button>
                  </div>
                  {activePicker === 'pickup' && suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#222222] border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(item, 'pickup')}
                          className="px-4 py-2.5 text-xs text-foreground hover:bg-[#333333] hover:text-white cursor-pointer border-b border-border/40 last:border-b-0"
                        >
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{item.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination Field */}
                <div className="relative">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Destination Location *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Type dropoff location..."
                      value={destInput}
                      onChange={(e) => handleQueryChange(e.target.value, 'destination')}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleLocateMe('destination')}
                      title="Use current location"
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                      disabled={locating !== null}
                    >
                      {locating === 'destination' ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation size={14} className="rotate-45" />
                      )}
                    </button>
                  </div>
                  {activePicker === 'destination' && suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#222222] border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(item, 'destination')}
                          className="px-4 py-2.5 text-xs text-foreground hover:bg-[#333333] hover:text-white cursor-pointer border-b border-border/40 last:border-b-0"
                        >
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{item.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Departure Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Preferred Time</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 font-bold mt-2"
                disabled={!pickupPoint || !destinationPoint}
              >
                <Search size={16} />
                Search Available Commutes
              </Button>
            </form>
          </Card>

          {/* Results list */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Search Results ({rides.length})</h2>
            
            {loading && (
              // Premium skeleton loaders
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse bg-[#121212]/40 border-border">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-accent rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-accent rounded-md w-1/4"></div>
                        <div className="h-3 bg-accent rounded-md w-3/4"></div>
                        <div className="h-3 bg-accent rounded-md w-1/2"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!loading && rides.length === 0 && (
              <Card className="text-center py-12 text-muted-foreground">
                No matching commutes found. Try adjust locations or departure parameters.
              </Card>
            )}

            {!loading && rides.length > 0 && (
              <div className="space-y-4">
                {rides.map(ride => {
                  const isDriverMe = user && ride.driverId && (ride.driverId._id || ride.driverId) === user._id;
                  return (
                    <Card key={ride._id} className="bg-[#121212] border-border hover:border-primary/20">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {/* Driver details */}
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
                              {renderStars(ride.driver.ratingAvg)}
                              <span className="text-[10px] text-muted-foreground font-mono">({ride.driver.ratingCount} reviews)</span>
                            </div>
                          </div>
                        </div>
                        {/* Fare Price tag */}
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-white font-mono">₹{ride.farePerSeat}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5 uppercase tracking-wider">Per Seat</span>
                        </div>
                      </div>

                      {/* Route summaries */}
                      <div className="border-t border-border/40 my-4 pt-4 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-foreground/80">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="truncate">Pickup: {ride.pickupPoint.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground/80">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="truncate">Destination: {ride.destination.address}</span>
                        </div>
                      </div>

                      {/* Match Ranking Explanation (judging highlight) */}
                      {ride.explanation && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary mb-4 flex items-start gap-2">
                          <BadgeAlert size={14} className="shrink-0 mt-0.5" />
                          <span>{ride.explanation}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-xs text-muted-foreground font-semibold">
                          Available: {ride.availableSeats} seat(s) left
                        </span>
                        
                        {isDriverMe ? (
                          <span className="text-xs text-muted-foreground italic">You are the driver</span>
                        ) : (
                          <Button 
                            variant="primary" 
                            onClick={() => openBookingModal(ride)} 
                            className="text-xs py-2 px-4"
                          >
                            Book Seat
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Leaflet Map Preview */}
        <div className="lg:w-[40%]">
          <div className="sticky top-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Route Bounding Frame</h2>
            <MapView
              pickup={pickupPoint}
              destination={destinationPoint}
              height="550px"
            />
          </div>
        </div>
      </div>

      {/* Booking Dialog Modal */}
      {isModalOpen && selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-[#121212] border-border shadow-2xl relative p-6">
            <div className="mb-4">
              <h3 className="font-bold text-lg text-white">Confirm Booking Request</h3>
              <p className="text-xs text-muted-foreground mt-1">Commute: {selectedRide.driver.name} ({selectedRide.vehicle?.model})</p>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold my-4">
                {bookingSuccess}
              </div>
            ) : (
              <div className="space-y-4 my-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Requested Seat Count</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSeatsRequested(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 bg-[#222222] border border-border hover:bg-[#333333] text-white rounded-xl text-center font-bold text-sm cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-lg font-bold font-mono text-white">{seatsRequested}</span>
                    <button
                      onClick={() => setSeatsRequested(prev => Math.min(selectedRide.availableSeats, prev + 1))}
                      className="w-10 h-10 bg-[#222222] border border-border hover:bg-[#333333] text-white rounded-xl text-center font-bold text-sm cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-[#222222]/40 rounded-xl p-4 border border-border/40 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Fare rate:</span>
                    <span className="text-white">₹{selectedRide.farePerSeat} / seat</span>
                  </div>
                  <div className="flex justify-between font-bold text-white mt-2 pt-2 border-t border-border/40">
                    <span>Total Fare Share:</span>
                    <span className="text-primary text-sm font-mono">₹{seatsRequested * selectedRide.farePerSeat}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                    {bookingError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" className="flex-1" onClick={submitBookingRequest}>Send Request</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default FindRide;
