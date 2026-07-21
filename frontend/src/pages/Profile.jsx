import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import apiClient from '../api/apiClient';
import { User, Car, Plus, ShieldCheck, Trash2, Edit2, AlertCircle } from 'lucide-react';

export const Profile = () => {
  const { user, fetchProfile } = useAuthStore();
  const [vehicles, setVehicles] = useState([]);
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    mobile: '',
    department: '',
    officeLocation: '',
    designation: '',
    emergencyContact: ''
  });

  // Vehicle Form State
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    registrationNumber: '',
    model: '',
    manufacturer: '',
    fuelType: 'petrol',
    color: '',
    seatingCapacity: 4,
    insuranceNumber: '',
    insuranceExpiry: ''
  });

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [vehicleSuccess, setVehicleSuccess] = useState('');
  const [vehicleError, setVehicleError] = useState('');

  const loadVehicles = async () => {
    try {
      const { data } = await apiClient.get('/vehicles');
      setVehicles(data.data);
    } catch (err) {
      console.error('Failed to load vehicles', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadVehicles();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        mobile: user.mobile || '',
        department: user.department || '',
        officeLocation: user.officeLocation || '',
        designation: user.designation || '',
        emergencyContact: user.emergencyContact || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const { data } = await apiClient.patch('/employee/profile', profileData);
      setProfileSuccess('Profile details updated successfully!');
      fetchProfile();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setVehicleSuccess('');
    setVehicleError('');

    try {
      await apiClient.post('/vehicles', vehicleData);
      setVehicleSuccess('Vehicle registered successfully!');
      setVehicleData({
        registrationNumber: '',
        model: '',
        manufacturer: '',
        fuelType: 'petrol',
        color: '',
        seatingCapacity: 4,
        insuranceNumber: '',
        insuranceExpiry: ''
      });
      setShowVehicleForm(false);
      loadVehicles();
    } catch (err) {
      setVehicleError(err.response?.data?.message || 'Failed to register vehicle');
    }
  };

  const deleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile & Vehicles</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure profile settings and register vehicles for offering rides</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Profile Card Form */}
        <div>
          <Card className="bg-[#121212] border-border">
            <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-4">
              <User size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Employee Information</h3>
            </div>

            {profileSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Department</label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Designation</label>
                  <input
                    type="text"
                    value={profileData.designation}
                    onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Office Hub Location</label>
                  <input
                    type="text"
                    value={profileData.officeLocation}
                    onChange={(e) => setProfileData({ ...profileData, officeLocation: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Emergency Mobile</label>
                  <input
                    type="tel"
                    value={profileData.emergencyContact}
                    onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#222222]/30 p-3.5 border border-border/60 rounded-xl text-[10px] text-muted-foreground font-mono">
                <div>Corporate ID: {user?.employeeCode}</div>
                <div className="mt-1">Corporate Email: {user?.email}</div>
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5 font-bold">
                Save Profile Configuration
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: Vehicle List & Register Form */}
        <div className="space-y-6">
          {/* Vehicle List */}
          <Card className="bg-[#121212] border-border">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <Car size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Registered Vehicles</h3>
              </div>
              {!showVehicleForm && (
                <button
                  onClick={() => setShowVehicleForm(true)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add Vehicle
                </button>
              )}
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No vehicles registered. Register one to offer commute rides.
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <div key={v._id} className="flex items-center justify-between p-3.5 bg-[#222222]/20 border border-border/60 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {v.manufacturer} {v.model}
                        <span className="text-[9px] uppercase tracking-wider bg-[#222222] px-2 py-0.5 rounded-full text-muted-foreground font-mono">
                          {v.registrationNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Fuel: {v.fuelType} • Cap: {v.seatingCapacity} seats • Color: {v.color}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteVehicle(v._id)}
                      className="text-red-400 hover:text-red-500 cursor-pointer p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Add Vehicle Form */}
          {showVehicleForm && (
            <Card className="bg-[#121212] border-border">
              <h3 className="font-bold text-sm text-white mb-4">Register New Vehicle</h3>
              
              {vehicleError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
                  {vehicleError}
                </div>
              )}

              <form onSubmit={handleVehicleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Plate Number *</label>
                    <input
                      type="text"
                      placeholder="GJ01AB1234"
                      value={vehicleData.registrationNumber}
                      onChange={(e) => setVehicleData({ ...vehicleData, registrationNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Tata, Hyundai"
                      value={vehicleData.manufacturer}
                      onChange={(e) => setVehicleData({ ...vehicleData, manufacturer: e.target.value })}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Model Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Nexon, Swift"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={vehicleData.color}
                      onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Fuel Type *</label>
                    <select
                      value={vehicleData.fuelType}
                      onChange={(e) => setVehicleData({ ...vehicleData, fuelType: e.target.value })}
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
                    <label className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Passenger Capacity *</label>
                    <input
                      type="number"
                      min="1"
                      value={vehicleData.seatingCapacity}
                      onChange={(e) => setVehicleData({ ...vehicleData, seatingCapacity: parseInt(e.target.value) || 4 })}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowVehicleForm(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1">Register</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
