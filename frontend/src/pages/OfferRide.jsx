import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRidesStore } from '../features/rides/ridesStore';
import { useMapsStore } from '../features/maps/mapsStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MapView } from '../components/MapView';
import apiClient from '../api/apiClient';
import { MapPin, Calendar, Clock, Plus, Navigation, ShieldAlert, Leaf, Coins, CheckSquare, Square } from 'lucide-react';

export const OfferRide = () => {
  const navigate = useNavigate();
  const publishRide = useRidesStore(state => state.publishRide);
  const { searchPlaces, getRoute, reverseGeocode } = useMapsStore();

  // Route pickers state
  const [pickupInput, setPickupInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [pickupPoint, setPickupPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  
  // Date & seat states
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('09:00');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [farePerSeat, setFarePerSeat] = useState(50);
  
  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [endDate, setEndDate] = useState('');

  // Route calculation rollup state
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMin: 0, points: [] });
  const [suggestedPrice, setSuggestedPrice] = useState(0);

  // Auto-suggest config fetched from Org config
  const [carpoolConfig, setCarpoolConfig] = useState(null);

  // Autocomplete UI helpers
  const [suggestions, setSuggestions] = useState([]);
  const [activePicker, setActivePicker] = useState(null);
  const [locating, setLocating] = useState(null); // 'pickup' or 'destination' or null
  const debounceTimer = useRef(null);

  const [formError, setFormError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');
  const [publishing, setPublishing] = useState(false);

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
            setRouteCalculated(false); // Reset route calculation since endpoints changed
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

  useEffect(() => {
    // Fetch organization carpoolConfig for cost suggestion
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/org/config');
        setCarpoolConfig(data.data);
      } catch (err) {
        console.error('Failed to load cost settings', err);
      }
    };
    fetchConfig();
  }, []);

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
        await searchPlaces(val);
        const storeSuggestions = useMapsStore.getState().suggestions;
        setSuggestions(storeSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 300);
  };

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
    setRouteCalculated(false); // Reset route if points change
  };

  const calculateRouteDetails = async () => {
    if (!pickupPoint || !destinationPoint) return;
    setFormError('');

    const fromLat = pickupPoint.coordinates[1];
    const fromLng = pickupPoint.coordinates[0];
    const toLat = destinationPoint.coordinates[1];
    const toLng = destinationPoint.coordinates[0];

    const route = await getRoute(fromLat, fromLng, toLat, toLng);
    if (route) {
      const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
      const durationMin = Math.round(route.time / 60000);
      
      setRouteInfo({
        distanceKm,
        durationMin,
        points: route.points
      });

      // suggested fare = distanceKm * operationalCostPerKm (default to ₹6.00 if config fails)
      const costPerKm = carpoolConfig?.operationalCostPerKm || 6.00;
      const suggested = Math.round(distanceKm * costPerKm);
      setSuggestedPrice(suggested);
      setFarePerSeat(suggested); // Default to suggested
      setRouteCalculated(true);
    } else {
      setFormError('Failed to calculate route. Please try again.');
    }
  };

  const toggleDay = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setFormError('');
    setPublishSuccess('');
    setPublishing(true);

    if (!pickupPoint || !destinationPoint || !departureDate || !departureTime || !farePerSeat) {
      setFormError('Please fill in all required route fields');
      setPublishing(false);
      return;
    }

    if (isRecurring && (!endDate || daysOfWeek.length === 0)) {
      setFormError('Please specify recurrence days and template end date');
      setPublishing(false);
      return;
    }

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
        endDate: new Date(endDate)
      } : undefined
    };

    const res = await publishRide(payload);
    if (res.success) {
      setPublishSuccess('Ride Offered Successfully! Colleagues can now book seats.');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setFormError(res.error);
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Offer a Ride</h1>
        <p className="text-sm text-muted-foreground mt-1">Publish an upcoming commute in your vehicle to share costs with colleagues</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Column */}
        <div className="flex-1 space-y-6">
          <Card className="bg-[#121212] border-border">
            <div className="space-y-4">
              {/* Pickup location autocomplete */}
              <div className="relative">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Pickup Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter pickup address..."
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
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#222222] border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
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

              {/* Destination location autocomplete */}
              <div className="relative">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Destination Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter office / dropoff address..."
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
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#222222] border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
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

              {!routeCalculated ? (
                <Button
                  onClick={calculateRouteDetails}
                  variant="secondary"
                  className="w-full py-2.5 text-xs font-bold"
                  disabled={!pickupPoint || !destinationPoint}
                >
                  <Navigation size={14} />
                  Calculate Route & Distance
                </Button>
              ) : (
                /* Revealed Ride Config Details */
                <form onSubmit={handlePublish} className="space-y-4 pt-2 border-t border-border/40">
                  <div className="grid grid-cols-3 gap-3 bg-[#222222]/30 p-4 border border-border/40 rounded-xl text-center">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Commute Distance</span>
                      <span className="text-sm font-bold text-white block mt-0.5 font-mono">{routeInfo.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Estimated Time</span>
                      <span className="text-sm font-bold text-white block mt-0.5 font-mono">{routeInfo.durationMin} mins</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Suggested Fare</span>
                      <span className="text-sm font-bold text-primary block mt-0.5 font-mono">₹{suggestedPrice}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Departure Date</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Departure Time</label>
                      <input
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Available Seats (Excl. Driver)</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={availableSeats}
                        onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Fare Share per Seat (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={farePerSeat}
                        onChange={(e) => setFarePerSeat(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Recurrence Toggle */}
                  <div className="border-t border-border/40 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className="flex items-center gap-2 text-xs text-foreground hover:text-white cursor-pointer transition-colors"
                    >
                      {isRecurring ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-muted-foreground" />}
                      <span>Configure Daily Commute Recurrence Template</span>
                    </button>

                    {isRecurring && (
                      <div className="mt-4 p-4 bg-[#222222]/20 border border-border/60 rounded-xl space-y-4">
                        <div>
                          <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Days of Week</label>
                          <div className="flex gap-1.5">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                              const active = daysOfWeek.includes(idx);
                              return (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => toggleDay(idx)}
                                  className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                                    active ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground hover:border-primary/40'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Template End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  {publishSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold">
                      {publishSuccess}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 text-sm font-bold"
                    disabled={publishing}
                  >
                    {publishing ? 'Publishing commute...' : 'Offer Ride Route'}
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Map Column */}
        <div className="lg:w-[45%]">
          <div className="sticky top-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Route confirmation preview</h2>
            <MapView
              pickup={pickupPoint}
              destination={destinationPoint}
              routePoints={routeInfo.points}
              height="550px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferRide;
