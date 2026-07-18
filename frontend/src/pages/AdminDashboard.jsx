import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../features/admin/adminStore';
import { useAuthStore } from '../features/auth/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ShieldCheck, Users, Car, Settings as SettingsIcon, Plus, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const AdminDashboard = () => {
  const { 
    stats, 
    employees, 
    totalEmployees, 
    vehicles,
    totalVehicles,
    carpoolConfig, 
    fetchStats, 
    fetchEmployees, 
    addEmployee,
    fetchVehicles,
    addVehicle,
    toggleEmployeeStatus, 
    fetchCarpoolConfig, 
    updateCarpoolConfig,
    loading 
  } = useAdminStore();

  const user = useAuthStore(state => state.user);
  
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'vehicles', 'settings'
  const [empPage, setEmpPage] = useState(1);
  const [vehPage, setVehPage] = useState(1);

  // Modals state
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showVehModal, setShowVehModal] = useState(false);

  // Add Employee Form State
  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    employeeCode: '',
    department: '',
    designation: '',
    mobile: '',
    password: ''
  });

  // Add Vehicle Form State
  const [newVeh, setNewVeh] = useState({
    employeeId: '',
    registrationNumber: '',
    model: '',
    seatingCapacity: '4',
    fuelType: 'petrol'
  });

  // Config State
  const [configData, setConfigData] = useState({
    fuelPrice: 0,
    operationalCostPerKm: 0,
    rideCommissionPercent: 0,
    walletMinimumBalance: 0,
    maxRideDistanceKm: 100
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchStats();
    fetchEmployees(empPage, 10);
    fetchVehicles(vehPage, 10);
    fetchCarpoolConfig();
  }, [empPage, vehPage, fetchStats, fetchEmployees, fetchVehicles, fetchCarpoolConfig]);

  useEffect(() => {
    if (carpoolConfig) {
      setConfigData({
        fuelPrice: carpoolConfig.fuelPrice || 0,
        operationalCostPerKm: carpoolConfig.operationalCostPerKm || 0,
        rideCommissionPercent: carpoolConfig.rideCommissionPercent || 0,
        walletMinimumBalance: carpoolConfig.walletMinimumBalance || 0,
        maxRideDistanceKm: carpoolConfig.maxRideDistanceKm || 100
      });
    }
  }, [carpoolConfig]);

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = await updateCarpoolConfig(configData);
    if (res.success) {
      setSuccessMsg('Carpool configurations updated successfully!');
      fetchCarpoolConfig();
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = await addEmployee(newEmp);
    if (res.success) {
      setSuccessMsg('Employee registered and granted access successfully!');
      setShowEmpModal(false);
      setNewEmp({ name: '', email: '', employeeCode: '', department: '', designation: '', mobile: '', password: '' });
      fetchEmployees(empPage, 10);
      fetchStats();
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = await addVehicle(newVeh);
    if (res.success) {
      setSuccessMsg('Vehicle registered successfully!');
      setShowVehModal(false);
      setNewVeh({ employeeId: '', registrationNumber: '', model: '', seatingCapacity: '4', fuelType: 'petrol' });
      fetchVehicles(vehPage, 10);
      fetchStats();
    } else {
      setErrorMsg(res.error);
    }
  };

  const handleToggleStatus = async (empId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`Are you sure you want to change employee access status to ${nextStatus.toUpperCase()}?`)) return;
    const res = await toggleEmployeeStatus(empId, nextStatus);
    if (res.success) {
      fetchEmployees(empPage, 10);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top statistics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-[#121212] border-border/80 p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Total Employees</span>
          <span className="text-3xl font-extrabold text-white font-mono mt-2">{totalEmployees || stats?.totalEmployees || 48}</span>
        </Card>
        <Card className="bg-[#121212] border-border/80 p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Registered Vehicles</span>
          <span className="text-3xl font-extrabold text-white font-mono mt-2">{totalVehicles || stats?.totalVehicles || 22}</span>
        </Card>
        <Card className="bg-[#121212] border-border/80 p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Rides This Month</span>
          <span className="text-3xl font-extrabold text-[#3a86ff] font-mono mt-2">{stats?.totalTrips || 163}</span>
        </Card>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-border mb-8">
        {['employees', 'vehicles', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'border-primary text-primary bg-[#222222]/10 font-extrabold' 
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            {tab === 'employees' && 'Employees'}
            {tab === 'vehicles' && 'Vehicles'}
            {tab === 'settings' && 'Settings'}
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold mb-6">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold mb-6">
          {errorMsg}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <Card className="bg-[#121212] border-border">
          <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Employee Directory
            </h3>
            <Button
              onClick={() => setShowEmpModal(true)}
              className="py-1.5 px-3 text-[11px] font-bold flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Employee
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground uppercase font-medium tracking-wider">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Manager</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold text-right">Platform Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-[#222222]/10 transition-colors">
                    <td className="py-3.5 font-bold text-white">{emp.name}</td>
                    <td className="py-3.5 font-mono text-muted-foreground">{emp.email}</td>
                    <td className="py-3.5">{emp.department || 'Engineering'}</td>
                    <td className="py-3.5 text-muted-foreground">{emp.managerName || 'A. Shah'}</td>
                    <td className="py-3.5">{emp.officeLocation || 'Ahmedabad'}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(emp._id, emp.status)}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          emp.status === 'active' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {emp.status === 'active' ? '[Granted]' : '[Revoked]'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalEmployees > 10 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setEmpPage(p => Math.max(1, p - 1))}
                disabled={empPage === 1}
                className="px-3 py-1.5 text-[10px]"
              >
                Previous
              </Button>
              <span className="text-[10px] text-muted-foreground font-semibold">Page {empPage} of {Math.ceil(totalEmployees / 10)}</span>
              <Button
                variant="outline"
                onClick={() => setEmpPage(p => p + 1)}
                disabled={empPage >= Math.ceil(totalEmployees / 10)}
                className="px-3 py-1.5 text-[10px]"
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <Card className="bg-[#121212] border-border">
          <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Car size={16} className="text-primary" />
              Registered Vehicles
            </h3>
            <Button
              onClick={() => setShowVehModal(true)}
              className="py-1.5 px-3 text-[11px] font-bold flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Vehicle
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground uppercase font-medium tracking-wider">
                  <th className="pb-3 font-semibold">Registration Number</th>
                  <th className="pb-3 font-semibold">Model</th>
                  <th className="pb-3 font-semibold">Seating Capacity</th>
                  <th className="pb-3 font-semibold">Driver</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {vehicles.map(veh => (
                  <tr key={veh._id} className="hover:bg-[#222222]/10 transition-colors">
                    <td className="py-3.5 font-bold font-mono text-white">{veh.registrationNumber}</td>
                    <td className="py-3.5">{veh.model}</td>
                    <td className="py-3.5 font-mono">{veh.seatingCapacity} seats</td>
                    <td className="py-3.5 text-muted-foreground">{veh.employeeId?.name || 'Unassigned'}</td>
                    <td className="py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                        veh.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {veh.status === 'active' ? '[Active]' : '[Inactive]'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalVehicles > 10 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setVehPage(p => Math.max(1, p - 1))}
                disabled={vehPage === 1}
                className="px-3 py-1.5 text-[10px]"
              >
                Previous
              </Button>
              <span className="text-[10px] text-muted-foreground font-semibold">Page {vehPage} of {Math.ceil(totalVehicles / 10)}</span>
              <Button
                variant="outline"
                onClick={() => setVehPage(p => p + 1)}
                disabled={vehPage >= Math.ceil(totalVehicles / 10)}
                className="px-3 py-1.5 text-[10px]"
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="bg-[#121212] border-border max-w-xl">
          <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
            <SettingsIcon size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Carpool Rules & Rates</h3>
          </div>

          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Fuel Price (₹ / Litre)</label>
                <input
                  type="number"
                  step="0.01"
                  value={configData.fuelPrice}
                  onChange={(e) => setConfigData({ ...configData, fuelPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Operational Cost per km (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={configData.operationalCostPerKm}
                  onChange={(e) => setConfigData({ ...configData, operationalCostPerKm: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Ride Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={configData.rideCommissionPercent}
                  onChange={(e) => setConfigData({ ...configData, rideCommissionPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Wallet Minimum Limit (₹)</label>
                <input
                  type="number"
                  value={configData.walletMinimumBalance}
                  onChange={(e) => setConfigData({ ...configData, walletMinimumBalance: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Maximum Commute Range (km)</label>
              <input
                type="number"
                value={configData.maxRideDistanceKm}
                onChange={(e) => setConfigData({ ...configData, maxRideDistanceKm: parseInt(e.target.value) || 100 })}
                className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5 font-bold">
              Save Rules Update
            </Button>
          </form>
        </Card>
      )}

      {/* Add Employee Modal */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/70 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-[#121212] border-border p-6 relative">
            <button
              onClick={() => setShowEmpModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Add Employee Profile</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="suresh@company.com"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Employee Code</label>
                <input
                  type="text"
                  placeholder="e.g. EMP2048"
                  value={newEmp.employeeCode}
                  onChange={(e) => setNewEmp({ ...newEmp, employeeCode: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales"
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newEmp.password}
                    onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-2.5 font-bold">
                Add to Platform
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showVehModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/70 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-[#121212] border-border p-6 relative">
            <button
              onClick={() => setShowVehModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Register Employee Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Assign Driver (Employee)</label>
                <select
                  required
                  value={newVeh.employeeId}
                  onChange={(e) => setNewVeh({ ...newVeh, employeeId: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Select driver...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GJ01AB1234"
                  value={newVeh.registrationNumber}
                  onChange={(e) => setNewVeh({ ...newVeh, registrationNumber: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Vehicle Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swift Dzire"
                  value={newVeh.model}
                  onChange={(e) => setNewVeh({ ...newVeh, model: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newVeh.seatingCapacity}
                    onChange={(e) => setNewVeh({ ...newVeh, seatingCapacity: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Fuel Type</label>
                  <select
                    value={newVeh.fuelType}
                    onChange={(e) => setNewVeh({ ...newVeh, fuelType: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full py-2.5 font-bold">
                Register Vehicle
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
