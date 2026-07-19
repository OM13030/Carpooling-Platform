import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRidesStore } from '../features/rides/ridesStore';
import { useMapsStore } from '../features/maps/mapsStore';
import { useAuthStore } from '../features/auth/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MapView } from '../components/MapView';
import { useRideSearch } from '../hooks/useRideSearch';
import { RideSearchResults } from '../components/RideSearchResults';
import apiClient from '../api/apiClient';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Navigation, 
  Search, 
  ArrowLeftRight, 
  Check, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Loader2, 
  Star, 
  BadgeAlert,
  User,
  Car
} from 'lucide-react';

export const RideFlow = ({ initialMode = 'find' }) => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const searchState = useRideSearch();
  
  // Rides Store
  const searchRides = useRidesStore(state => state.searchRides);
  const publishRide = useRidesStore(state => state.publishRide);
  const sendRideRequest = useRidesStore(state => state.sendRideRequest);
  const rides = useRidesStore(state => state.rides);
  const ridesLoading = useRidesStore(state => state.loading);
  const ridesError = useRidesStore(state => state.error);

  // Maps Store
  const { searchPlaces, getRoute, reverseGeocode } = useMapsStore();

  // Mode state ('find' or 'offer')
  const [mode, setMode] = useState(initialMode);
  
  // Flow step ('input', 'confirm', 'results')
  const [step, setStep] = useState('input');

  // Input states
  const [pickupInput, setPickupInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [pickupPoint, setPickupPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  
  // Location label guides
  const [pickupLabel, setPickupLabel] = useState('');
  const [destLabel, setDestLabel] = useState('');

  // Smart Date & Time defaults (now + 15 min rounded to next 5 min)
  const getSmartDefaultDateTime = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 15 * 60 * 1000);
    // round to next 5 minutes
    const minutes = future.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    future.setMinutes(roundedMinutes);
    future.setSeconds(0);
    future.setMilliseconds(0);

    const dateStr = future.toISOString().split('T')[0];
    const hrs = String(future.getHours()).padStart(2, '0');
    const mins = String(future.getMinutes()).padStart(2, '0');
    return { date: dateStr, time: `${hrs}:${mins}` };
  };

  const defaults = getSmartDefaultDateTime();
  const [departureDate, setDepartureDate] = useState(defaults.date);
  const [departureTime, setDepartureTime] = useState(defaults.time);

  // Seats State
  const [seatsRequested, setSeatsRequested] = useState(1); // passenger side
  const [availableSeats, setAvailableSeats] = useState(3); // driver side

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [activePicker, setActivePicker] = useState(null); // 'pickup' or 'destination'
  const [locating, setLocating] = useState(null); // 'pickup' | 'destination' | null
  const debounceTimer = useRef(null);

  // Saved places list
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSavedPlaces, setShowSavedPlaces] = useState(null); // 'pickup' | 'destination' | null

  // Vehicles list for driver
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Carpool configuration
  const [carpoolConfig, setCarpoolConfig] = useState(null);

  // Calculated route metrics
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMin: 0, points: [] });
  const [farePerSeat, setFarePerSeat] = useState(0);
  const [suggestedFare, setSuggestedFare] = useState(0);

  // Status logs
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRideToBook, setSelectedRideToBook] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // 10-minute nearby search countdown timer states
  const [searchTimer, setSearchTimer] = useState(600);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isSearchingNearby && searchTimer > 0) {
      interval = setInterval(() => {
        setSearchTimer(prev => prev - 1);
      }, 1000);
    } else if (searchTimer === 0) {
      setIsSearchingNearby(false);
    }
    return () => clearInterval(interval);
  }, [isSearchingNearby, searchTimer]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Fetch initial configs & data
  useEffect(() => {
    // Geolocation prefill
    if (navigator.geolocation) {
      setLocating('pickup');
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
              setPickupPoint(geo);
              setPickupInput(geo.address);
              setPickupLabel('Using your current location — tap to change');
            }
          } catch (e) {
            console.error('Failed to reverse geocode current position', e);
          } finally {
            setLocating(null);
          }
        },
        (err) => {
          console.warn('Geolocation access denied/failed:', err.message);
          setLocating(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    // Fetch saved places
    const fetchSaved = async () => {
      try {
        const { data } = await apiClient.get('/saved-places');
        setSavedPlaces(data.data || []);
      } catch (err) {
        console.error('Failed to load saved places', err);
      }
    };
    fetchSaved();

    // Fetch carpool configuration
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/org/config');
        setCarpoolConfig(data.data);
      } catch (err) {
        console.error('Failed to fetch organization carpool config', err);
      }
    };
    fetchConfig();
  }, [reverseGeocode]);

  // Fetch driver vehicles if mode is 'offer'
  useEffect(() => {
    if (mode === 'offer' && vehicles.length === 0) {
      const fetchVehicles = async () => {
        try {
          setVehiclesLoading(true);
          const { data } = await apiClient.get('/vehicles');
          const list = data.data || [];
          setVehicles(list);
          const active = list.find(v => v.status === 'active') || list[0];
          setSelectedVehicle(active || null);
          if (active) {
            setAvailableSeats(Math.max(1, active.seatingCapacity - 1));
          }
        } catch (err) {
          console.error('Failed to load employee vehicles', err);
        } finally {
          setVehiclesLoading(false);
        }
      };
      fetchVehicles();
    }
  }, [mode, vehicles.length]);

  // Handle autocomplete input changes
  const handleQueryChange = (val, type) => {
    if (type === 'pickup') {
      setPickupInput(val);
      setPickupLabel('');
    } else {
      setDestInput(val);
      setDestLabel('');
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (val.trim().length >= 2) {
        setActivePicker(type);
        try {
          await searchPlaces(val);
          const storeSuggestions = useMapsStore.getState().suggestions;
          setSuggestions(storeSuggestions);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
      }
    }, 250);
  };

  // Select suggestion from list
  const selectSuggestion = (item, type) => {
    const geo = {
      address: item.address || item.name,
      type: 'Point',
      coordinates: [item.lng, item.lat]
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
    setShowSavedPlaces(null);
  };

  // Select saved place chip
  const selectSavedPlace = (place, type) => {
    const geo = {
      address: place.location.address,
      type: 'Point',
      coordinates: place.location.coordinates
    };

    if (type === 'pickup') {
      setPickupPoint(geo);
      setPickupInput(geo.address);
      setPickupLabel(`Saved: ${place.label}`);
    } else {
      setDestinationPoint(geo);
      setDestInput(geo.address);
      setDestLabel(`Saved: ${place.label}`);
    }
    setShowSavedPlaces(null);
  };

  // Handle location update from pin drag
  const handleMarkerDrag = async (lat, lng, type) => {
    try {
      const res = await reverseGeocode(lat, lng);
      if (res) {
        const geo = {
          address: res.address,
          type: 'Point',
          coordinates: [lng, lat]
        };
        if (type === 'pickup') {
          setPickupPoint(geo);
          setPickupInput(geo.address);
          setPickupLabel('Map chosen point');
        } else {
          setDestinationPoint(geo);
          setDestInput(geo.address);
          setDestLabel('Map chosen point');
        }
        // Recalculate route automatically
        calculateRoute(geo, type === 'pickup' ? destinationPoint : pickupPoint);
      }
    } catch (err) {
      console.error('Drag geocoding failed', err);
    }
  };

  // Map Click handler (places pin for active or empty field)
  const handleMapClick = async (lat, lng) => {
    const type = activePicker || (!pickupPoint ? 'pickup' : 'destination');
    handleMarkerDrag(lat, lng, type);
  };

  // Swap pickup & destination locations
  const handleSwap = () => {
    const tempInput = pickupInput;
    const tempPoint = pickupPoint;
    const tempLabel = pickupLabel;

    setPickupInput(destInput);
    setPickupPoint(destinationPoint);
    setPickupLabel(destLabel);

    setDestInput(tempInput);
    setDestinationPoint(tempPoint);
    setDestLabel(tempLabel);
  };

  // Calculate Route via GraphHopper API
  const calculateRoute = async (pPoint = pickupPoint, dPoint = destinationPoint) => {
    if (!pPoint || !dPoint) return;
    setLoadingRoute(true);
    setStatusError('');

    try {
      const fromLat = pPoint.coordinates[1];
      const fromLng = pPoint.coordinates[0];
      const toLat = dPoint.coordinates[1];
      const toLng = dPoint.coordinates[0];

      const route = await getRoute(fromLat, fromLng, toLat, toLng);
      if (route) {
        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMin = Math.round(route.time / 60000);

        setRouteInfo({
          distanceKm,
          durationMin,
          points: route.points
        });

        // suggested fare computation
        const costPerKm = carpoolConfig?.operationalCostPerKm || 6.00;
        const suggested = Math.round(distanceKm * costPerKm);
        setSuggestedFare(suggested);
        setFarePerSeat(suggested);
        setStep('confirm');
      } else {
        setStatusError('Unable to map route between these locations.');
      }
    } catch (err) {
      console.error(err);
      setStatusError('Route lookup failed.');
    } finally {
      setLoadingRoute(false);
    }
  };

  // Confirm and proceed (Find matches or Publish ride)
  const handleConfirmAndProceed = async () => {
    setStatusError('');
    setStatusSuccess('');

    if (mode === 'find') {
      // Find Ride -> Trigger matching rides search
      try {
        const resData = await searchState.mutateAsync({
          pickup: {
            lat: pickupPoint.coordinates[1],
            lng: pickupPoint.coordinates[0],
            address: pickupPoint.address
          },
          destination: {
            lat: destinationPoint.coordinates[1],
            lng: destinationPoint.coordinates[0],
            address: destinationPoint.address
          },
          date: departureDate,
          time: departureTime,
          seats: seatsRequested
        });
        setStep('results');
        
        if (resData.status === 'not_found') {
          setSearchTimer(600); // 10 minutes
          setIsSearchingNearby(true);
        } else {
          setIsSearchingNearby(false);
        }
      } catch (err) {
        setStatusError(err.message || 'Failed to fetch matching commutes.');
      }
    } else {
      // Offer Ride -> Publish ride
      setPublishing(true);
      try {
        const payload = {
          pickupPoint,
          destination: destinationPoint,
          departureDate: `${departureDate}T${departureTime}:00`,
          departureTime,
          availableSeats,
          farePerSeat,
          estimatedDistanceKm: routeInfo.distanceKm,
          estimatedDurationMin: routeInfo.durationMin,
          isRecurring,
          recurrenceRule: isRecurring ? {
            daysOfWeek,
            endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days template
          } : undefined
        };

        const res = await publishRide(payload);
        if (res.success) {
          setStatusSuccess('Ride Offered Successfully! Colleagues can now book seats.');
          setTimeout(() => navigate('/trips'), 1500);
        } else {
          setStatusError(res.error || 'Failed to offer ride');
        }
      } catch (err) {
        setStatusError('Server error while publishing ride.');
      } finally {
        setPublishing(false);
      }
    }
  };

  // Mode Switch
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setStep('input');
    setStatusError('');
    setStatusSuccess('');
  };

  // Booking Modal Triggers
  const openBookingModal = (ride) => {
    setSelectedRideToBook(ride);
    setBookingSuccess('');
    setBookingError('');
    setIsBookingModalOpen(true);
  };

  const submitBookingRequest = async () => {
    if (!selectedRideToBook) return;
    setBookingError('');
    setBookingSuccess('');

    const res = await sendRideRequest({
      rideId: selectedRideToBook._id,
      seatsRequested,
      pickupPoint
    });

    if (res.success) {
      setBookingSuccess('Booking request sent successfully! Colleague notified.');
      setTimeout(() => {
        setIsBookingModalOpen(false);
        // refresh search results list
        handleConfirmAndProceed();
      }, 1500);
    } else {
      setBookingError(res.error);
    }
  };

  // Driver seats select representation
  const renderSeatsVisual = () => {
    if (!selectedVehicle) return null;
    const capacity = selectedVehicle.seatingCapacity || 4;
    const seats = [];

    // The first seat is the driver's seat (occupied)
    seats.push(
      <div 
        key="driver" 
        title="Driver Seat (Occupied)" 
        className="w-8 h-8 rounded-lg bg-accent text-muted-foreground flex items-center justify-center border border-border/80"
      >
        <User size={14} className="fill-current text-muted-foreground/60" />
      </div>
    );

    // Remaining seats are available vs filled (driver blocked/offered)
    for (let i = 1; i < capacity; i++) {
      const isOffered = i <= availableSeats;
      seats.push(
        <button
          key={i}
          type="button"
          onClick={() => setAvailableSeats(i)}
          title={isOffered ? 'Seat Offered' : 'Blocked Seat'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
            isOffered 
              ? 'bg-primary/20 border-primary text-primary' 
              : 'bg-[#222222]/40 border-border text-muted-foreground/40'
          }`}
        >
          <User size={14} className={isOffered ? 'fill-current' : ''} />
        </button>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-2">
        {seats}
        <span className="text-xs text-muted-foreground ml-2 font-mono">
          ({availableSeats} offered, {capacity - 1 - availableSeats} blocked)
        </span>
      </div>
    );
  };

  // Weekdays recurrence helpers
  const toggleWeekday = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const weekdays = [
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 },
    { label: 'S', value: 0 }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'find' ? 'Find a Ride' : 'Offer a Ride'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'find' 
              ? 'Book a seat offered by verified colleagues in your company' 
              : 'Publish an upcoming commute in your vehicle to share costs'}
          </p>
        </div>
        {step !== 'input' && (
          <Button 
            variant="outline" 
            onClick={() => setStep('input')} 
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Back to Parameters
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side Controls */}
        <div className="flex-1 space-y-6">
          {/* Main Form/Controls Card */}
          <Card className="bg-[#121212] border-border p-6 relative overflow-visible">
            {/* Mode Tab Toggle Control (Layout Priority 1) */}
            <div className="flex bg-[#222222] p-1 rounded-2xl border border-border/85 mb-6 relative z-10">
              <button
                disabled={isSearchingNearby}
                onClick={() => handleModeChange('find')}
                className={`flex-1 text-center py-2.5 rounded-xl font-bold transition-all duration-200 text-sm ${
                  mode === 'find' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-white'
                } ${isSearchingNearby ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Find Ride
              </button>
              <button
                disabled={isSearchingNearby}
                onClick={() => handleModeChange('offer')}
                className={`flex-1 text-center py-2.5 rounded-xl font-bold transition-all duration-200 text-sm ${
                  mode === 'offer' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-white'
                } ${isSearchingNearby ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Offer Ride
              </button>
            </div>

            {step === 'input' ? (
              <div className="space-y-4">
                {/* Start / Destination fields with Swap Control (Layout Priority 2) */}
                <div className="relative space-y-4">
                  {/* Start Location Input */}
                  <div className="relative">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      Start Location *
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search pickup point..."
                        value={pickupInput}
                        onFocus={() => setShowSavedPlaces('pickup')}
                        onChange={(e) => handleQueryChange(e.target.value, 'pickup')}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none"
                      />
                      {locating === 'pickup' && (
                        <div className="absolute right-3.5 top-3.5">
                          <Loader2 size={14} className="animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    {pickupLabel && (
                      <span className="text-[10px] text-primary/80 font-medium mt-1 block">
                        {pickupLabel}
                      </span>
                    )}

                    {/* Autocomplete list */}
                    {activePicker === 'pickup' && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-[#222222] border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
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

                    {/* Saved Place Chips (One tap away) */}
                    {showSavedPlaces === 'pickup' && savedPlaces.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {savedPlaces.map((place) => (
                          <button
                            key={place._id}
                            type="button"
                            onClick={() => selectSavedPlace(place, 'pickup')}
                            className="bg-[#222222] hover:bg-[#333333] border border-border/80 text-muted-foreground hover:text-white px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            {place.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Control Icon */}
                  <div className="flex justify-center relative -my-2.5 z-10">
                    <button
                      type="button"
                      onClick={handleSwap}
                      title="Swap Locations"
                      className="bg-[#222222] border border-border hover:border-primary/40 text-muted-foreground hover:text-primary rounded-full p-2 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <ArrowLeftRight size={14} className="rotate-90" />
                    </button>
                  </div>

                  {/* Destination Input */}
                  <div className="relative">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      Destination Location *
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search office/dropoff location..."
                        value={destInput}
                        onFocus={() => setShowSavedPlaces('destination')}
                        onChange={(e) => handleQueryChange(e.target.value, 'destination')}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    {destLabel && (
                      <span className="text-[10px] text-primary/80 font-medium mt-1 block">
                        {destLabel}
                      </span>
                    )}

                    {/* Autocomplete list */}
                    {activePicker === 'destination' && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-[#222222] border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
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

                    {/* Saved Place Chips (One tap away) */}
                    {showSavedPlaces === 'destination' && savedPlaces.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {savedPlaces.map((place) => (
                          <button
                            key={place._id}
                            type="button"
                            onClick={() => selectSavedPlace(place, 'destination')}
                            className="bg-[#222222] hover:bg-[#333333] border border-border/80 text-muted-foreground hover:text-white px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            {place.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date & Time Picker inputs (Auto-filled Defaults, Layout Priority 3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      Departure Date
                    </label>
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
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      Preferred Time
                    </label>
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

                {/* Seats selection (Layout Priority 4) */}
                {mode === 'find' ? (
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      Seats Needed
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSeatsRequested(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 bg-[#222222] border border-border hover:bg-[#333333] text-white rounded-xl text-center font-bold text-sm cursor-pointer transition-colors"
                      >
                        <Minus size={14} className="mx-auto" />
                      </button>
                      <span className="w-12 text-center text-lg font-bold font-mono text-white">
                        {seatsRequested}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSeatsRequested(prev => Math.min(6, prev + 1))}
                        className="w-10 h-10 bg-[#222222] border border-border hover:bg-[#333333] text-white rounded-xl text-center font-bold text-sm cursor-pointer transition-colors"
                      >
                        <Plus size={14} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                        Selected Commute Vehicle
                      </label>
                      {vehiclesLoading ? (
                        <div className="h-10 bg-[#222222] border border-border rounded-xl animate-pulse" />
                      ) : vehicles.length === 0 ? (
                        <div className="text-xs text-red-400 bg-red-500/5 p-3.5 border border-red-500/20 rounded-xl">
                          No registered vehicles found. Register a vehicle in Settings first.
                        </div>
                      ) : (
                        <select
                          value={selectedVehicle?._id || ''}
                          onChange={(e) => {
                            const selected = vehicles.find(v => v._id === e.target.value);
                            setSelectedVehicle(selected);
                            if (selected) {
                              setAvailableSeats(Math.max(1, selected.seatingCapacity - 1));
                            }
                          }}
                          className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          {vehicles.map(v => (
                            <option key={v._id} value={v._id}>
                              {v.manufacturer} {v.model} ({v.registrationNumber})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {selectedVehicle && (
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Vehicle Seat Allocation (Tap to adjust offered seats)
                        </label>
                        {renderSeatsVisual()}
                      </div>
                    )}
                  </div>
                )}

                {/* Recurring ride configuration (Layout Priority 6) */}
                <div className="border-t border-border/40 pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="recurrence-check"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-[#222222] border-border"
                    />
                    <label htmlFor="recurrence-check" className="text-xs font-semibold text-white cursor-pointer select-none">
                      Setup as Weekly Recurring Ride
                    </label>
                  </div>

                  {isRecurring && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-3"
                    >
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        * Book this ride for every selected day this week, auto-continuing next week.
                      </span>

                      {/* Weekday Picker */}
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                          Active Commute Weekdays
                        </label>
                        <div className="flex gap-1.5">
                          {weekdays.map((day) => {
                            const active = daysOfWeek.includes(day.value);
                            return (
                              <button
                                type="button"
                                key={day.label + day.value}
                                onClick={() => toggleWeekday(day.value)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  active 
                                    ? 'bg-primary text-white border-primary' 
                                    : 'bg-[#222222] text-muted-foreground border border-border/60 hover:text-white'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recurrence End Date */}
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                          Template End Date
                        </label>
                        <input
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {statusError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                    {statusError}
                  </div>
                )}

                <Button
                  onClick={() => calculateRoute()}
                  variant="primary"
                  className="w-full py-3 font-bold mt-2"
                  disabled={!pickupPoint || !destinationPoint || loadingRoute}
                >
                  {loadingRoute ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mapping Route...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Verify Route & Fare Estimate
                    </>
                  )}
                </Button>
              </div>
            ) : step === 'confirm' ? (
              <div className="space-y-4">
                {/* Route confirmation + live fare estimate (Layout Priority 5) */}
                <h3 className="font-bold text-sm text-white border-b border-border/40 pb-2">
                  Confirm Ride Parameters
                </h3>
                
                <div className="bg-[#222222]/40 rounded-xl p-4 border border-border/40 text-xs space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup Address:</span>
                    <span className="text-white font-medium text-right max-w-[70%] truncate">
                      {pickupPoint?.address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destination:</span>
                    <span className="text-white font-medium text-right max-w-[70%] truncate">
                      {destinationPoint?.address}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/20">
                    <span className="text-muted-foreground">Distance / Duration:</span>
                    <span className="text-white font-bold font-mono">
                      {routeInfo.distanceKm} km / {routeInfo.durationMin} mins
                    </span>
                  </div>

                  {mode === 'offer' && (
                    <div className="pt-2 border-t border-border/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Suggested Seat Fare:</span>
                        <span className="text-white font-semibold font-mono">₹{suggestedFare}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-primary font-bold">Set Fare per Seat (₹):</label>
                        <input
                          type="number"
                          value={farePerSeat}
                          onChange={(e) => setFarePerSeat(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-20 bg-[#222222] border border-border rounded-lg px-2 py-1 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {statusError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                    {statusError}
                  </div>
                )}

                {statusSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs">
                    {statusSuccess}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-left">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      {mode === 'find' ? 'Estimated Fare' : 'Estimated Return'}
                    </span>
                    <span className="text-lg font-extrabold text-white font-mono">
                      ₹{mode === 'find' ? farePerSeat * seatsRequested : farePerSeat * availableSeats}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {mode === 'find' ? `for ${seatsRequested} seat(s)` : `for ${availableSeats} passenger(s)`}
                    </span>
                  </div>

                  <Button
                    onClick={handleConfirmAndProceed}
                    variant="primary"
                    className="flex-1 py-3 font-bold"
                    disabled={publishing}
                  >
                    {publishing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      mode === 'find' ? 'Find Matching Rides' : 'Offer Ride'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Step: 'results' (matched commutes search list)
              <RideSearchResults
                searchState={searchState}
                pickup={pickupPoint}
                destination={destinationPoint}
                onBookRide={openBookingModal}
                isSearchingNearby={isSearchingNearby}
                searchTimer={searchTimer}
                setIsSearchingNearby={setIsSearchingNearby}
                setSearchTimer={setSearchTimer}
                currentUser={user}
              />
            )}
          </Card>
        </div>

        {/* Right Side Maps Bounding Frame */}
        <div className="lg:w-[45%]">
          <div className="sticky top-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              Route Confirmation Map
            </h2>
            <MapView
              pickup={pickupPoint}
              destination={destinationPoint}
              routePoints={step === 'confirm' || step === 'results' ? routeInfo.points : []}
              height="550px"
              onPickupChange={(lat, lng) => handleMarkerDrag(lat, lng, 'pickup')}
              onDestinationChange={(lat, lng) => handleMarkerDrag(lat, lng, 'destination')}
              onMapClick={handleMapClick}
            />
            {step === 'confirm' && (
              <span className="text-[10px] text-muted-foreground block mt-2 text-center">
                * Drag pins on the map or tap the map to customize coordinates.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Booking Dialog Modal */}
      {isBookingModalOpen && selectedRideToBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-[#121212] border-border shadow-2xl relative p-6">
            <div className="mb-4">
              <h3 className="font-bold text-lg text-white">Confirm Booking Request</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Commute: {selectedRideToBook.driver.name} ({selectedRideToBook.vehicle?.model})
              </p>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold my-4">
                {bookingSuccess}
              </div>
            ) : (
              <div className="space-y-4 my-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Requested Seat Count
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSeatsRequested(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 bg-[#222222] border border-border hover:bg-[#333333] text-white rounded-xl text-center font-bold text-sm cursor-pointer transition-colors"
                    >
                      <Minus size={14} className="mx-auto" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold font-mono text-white">
                      {seatsRequested}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSeatsRequested(prev => Math.min(selectedRideToBook.availableSeats, prev + 1))}
                      className="w-10 h-10 bg-[#222222] border border-border hover:bg-[#333333] text-white rounded-xl text-center font-bold text-sm cursor-pointer transition-colors"
                    >
                      <Plus size={14} className="mx-auto" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#222222]/40 rounded-xl p-4 border border-border/40 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Fare rate:</span>
                    <span className="text-white">₹{selectedRideToBook.farePerSeat} / seat</span>
                  </div>
                  <div className="flex justify-between font-bold text-white mt-2 pt-2 border-t border-border/40">
                    <span>Total Fare Share:</span>
                    <span className="text-primary text-sm font-mono">
                      ₹{seatsRequested * selectedRideToBook.farePerSeat}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                    {bookingError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setIsBookingModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={submitBookingRequest}>
                    Send Request
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default RideFlow;
