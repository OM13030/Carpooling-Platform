import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPinned, Plus, Trash2, Home, Briefcase, Heart, Search, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import MapView from '../components/MapView';

const SavedPlaces = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Place Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null); // { name, address, lat, lng }
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/places');
      setPlaces(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch saved places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Handle Autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await apiClient.get(`/maps/geocode?query=${encodeURIComponent(searchQuery)}`);
        setSuggestions(data.data || []);
      } catch (err) {
        console.error('Geocoding autocomplete failed', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectSuggestion = (place) => {
    setSelectedPlace(place);
    setSearchQuery(place.address || place.name);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label || !selectedPlace) {
      setError('Please provide a label and select a valid location');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        label,
        location: {
          address: selectedPlace.address || selectedPlace.name,
          coordinates: [selectedPlace.lng, selectedPlace.lat] // GeoJSON: [lng, lat]
        }
      };

      await apiClient.post('/places', payload);
      setLabel('');
      setSearchQuery('');
      setSelectedPlace(null);
      setShowAddForm(false);
      fetchPlaces();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save place');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved place?')) return;
    try {
      await apiClient.delete(`/places/${id}`);
      fetchPlaces();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete saved place');
    }
  };

  const getLabelIcon = (placeLabel) => {
    const l = placeLabel.toLowerCase();
    if (l === 'home') return <Home size={16} className="text-primary" />;
    if (l === 'office' || l === 'work') return <Briefcase size={16} className="text-amber-500" />;
    return <Heart size={16} className="text-red-500" />;
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
            <MapPinned size={14} /> Places
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Saved Places</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Store home, office and favorite destinations for faster booking and ride publishing.
          </p>
        </div>

        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="min-w-[160px]">
            <Plus size={16} className="mr-2" />
            Add New Place
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Places List */}
        <div className={showAddForm ? "lg:col-span-5 space-y-4" : "lg:col-span-12 space-y-4"}>
          <Card className="bg-[#121212] border-border/70 p-5">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Saved Locations</h3>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border/70 rounded-2xl p-5">
                No saved places yet. Add your Home, Work, or favorite endpoints!
              </div>
            ) : (
              <div className="space-y-3">
                {places.map((place) => (
                  <div key={place._id} className="flex items-start justify-between p-4 bg-[#222222]/20 border border-border/60 rounded-xl hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
                        {getLabelIcon(place.label)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider">{place.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 max-w-sm">{place.location?.address}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(place._id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Add Form / Map Preview */}
        {showAddForm && (
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-[#121212] border-border/70 p-5">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Add Saved Place</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Label (e.g. Home, Office, Gym)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Home"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Search Address (GraphHopper Autocomplete)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Type a location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </div>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[#18181a] border border-border rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(s)}
                          className="px-4 py-3 text-xs text-muted-foreground hover:text-white hover:bg-primary/10 cursor-pointer border-b border-border/20 last:border-0"
                        >
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[10px] mt-0.5">{s.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map Preview */}
                {selectedPlace && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Map Preview</label>
                    <MapView 
                      pickup={{ coordinates: [selectedPlace.lng, selectedPlace.lat], address: selectedPlace.address }}
                      height="240px"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAddForm(false); setSelectedPlace(null); setSearchQuery(''); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !selectedPlace} className="flex-1">
                    {submitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                    Save Place
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SavedPlaces;
