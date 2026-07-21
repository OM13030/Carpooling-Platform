import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Plus, Trash2, Edit2, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const MyVehicle = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [fuelType, setFuelType] = useState('petrol');
  const [color, setColor] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState(4);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/vehicles');
      setVehicles(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleEditClick = (v) => {
    setEditingId(v._id);
    setRegistrationNumber(v.registrationNumber);
    setModel(v.model);
    setManufacturer(v.manufacturer || '');
    setFuelType(v.fuelType);
    setColor(v.color || '');
    setSeatingCapacity(v.seatingCapacity);
    setInsuranceNumber(v.insuranceNumber || '');
    setInsuranceExpiry(v.insuranceExpiry ? new Date(v.insuranceExpiry).toISOString().split('T')[0] : '');
    setShowForm(true);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setRegistrationNumber('');
    setModel('');
    setManufacturer('');
    setFuelType('petrol');
    setColor('');
    setSeatingCapacity(4);
    setInsuranceNumber('');
    setInsuranceExpiry('');
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        registrationNumber,
        model,
        manufacturer,
        fuelType,
        color,
        seatingCapacity: Number(seatingCapacity),
        insuranceNumber,
        insuranceExpiry
      };

      if (editingId) {
        await apiClient.patch(`/vehicles/${editingId}`, payload);
      } else {
        await apiClient.post('/vehicles', payload);
      }

      handleResetForm();
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
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
            <Car size={14} /> Vehicles
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">My Vehicles</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Manage your registered vehicles, track their verification statuses and insurance details.
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="min-w-[160px]">
            <Plus size={16} className="mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vehicles list */}
        <div className={showForm ? 'lg:col-span-6 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <Card className="bg-[#121212] border-border/70 p-5">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Your Vehicles</h3>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/70 rounded-2xl p-5">
                No vehicles registered. Add your first vehicle to offer rides!
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((v) => (
                  <div key={v._id} className="p-4 bg-[#222222]/20 border border-border/60 rounded-xl flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {v.manufacturer} {v.model}
                        </span>
                        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-mono px-2 py-0.5 rounded-full font-bold">
                          {v.registrationNumber}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Fuel: <span className="text-white capitalize">{v.fuelType}</span> • Seats: <span className="text-white">{v.seatingCapacity}</span> • Color: <span className="text-white capitalize">{v.color || 'N/A'}</span></div>
                        {v.insuranceNumber && (
                          <div>Insurance: <span className="text-white">{v.insuranceNumber}</span> (Expires: <span className="text-white font-mono">{v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : 'N/A'}</span>)</div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {/* Verification badge */}
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <ShieldCheck size={11} /> Verified
                        </span>
                        {/* Insurance status */}
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          Insurance Valid
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(v)}
                        className="text-primary hover:text-white hover:bg-primary/10 p-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="lg:col-span-6 space-y-6">
            <Card className="bg-[#121212] border-border/70 p-5">
              <h3 className="font-bold text-sm text-white mb-4">
                {editingId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Plate Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="GJ01AB1234"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Tata"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Model Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nexon"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Fuel Type</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Seating Capacity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={seatingCapacity}
                      onChange={(e) => setSeatingCapacity(Number(e.target.value) || 4)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Insurance Policy No.</label>
                    <input
                      type="text"
                      placeholder="INS-12345"
                      value={insuranceNumber}
                      onChange={(e) => setInsuranceNumber(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Insurance Expiry Date</label>
                    <input
                      type="date"
                      value={insuranceExpiry}
                      onChange={(e) => setInsuranceExpiry(e.target.value)}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleResetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                    {editingId ? 'Save Changes' : 'Register Vehicle'}
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

export default MyVehicle;
