import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../features/admin/adminStore';
import { useAuthStore } from '../features/auth/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Leaf, Navigation, Coins, ShieldCheck, UserCheck, AlertTriangle, Users, Settings } from 'lucide-react';

export const AdminDashboard = () => {
  const { 
    stats, 
    employees, 
    totalEmployees, 
    carpoolConfig, 
    fetchStats, 
    fetchEmployees, 
    toggleEmployeeStatus, 
    fetchCarpoolConfig, 
    updateCarpoolConfig,
    loading 
  } = useAdminStore();

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'employees', 'config'
  const [empPage, setEmpPage] = useState(1);

  // Carpool Config State
  const [configData, setConfigData] = useState({
    fuelPrice: 0,
    operationalCostPerKm: 0,
    rideCommissionPercent: 0,
    walletMinimumBalance: 0,
    maxRideDistanceKm: 100
  });

  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchEmployees(empPage, 10);
    fetchCarpoolConfig();
  }, [empPage, fetchStats, fetchEmployees, fetchCarpoolConfig]);

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
    setConfigSuccess('');
    setConfigError('');

    const res = await updateCarpoolConfig(configData);
    if (res.success) {
      setConfigSuccess('Organization carpool configurations updated successfully!');
      fetchCarpoolConfig();
    } else {
      setConfigError(res.error);
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
      {/* Admin header */}
      <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Control Console</h1>
            <p className="text-xs text-muted-foreground">Supervisor Portal • {user?.name}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout} className="text-xs text-red-400 hover:bg-red-500/10">
          Sign Out
        </Button>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-border mb-8">
        {['analytics', 'employees', 'config'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'border-primary text-primary bg-[#222222]/10 font-extrabold' 
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            {tab === 'analytics' && 'Fleet Analytics'}
            {tab === 'employees' && 'Employee Access'}
            {tab === 'config' && 'Rates & Rules'}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Carbon/Cost summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-[#121212] border-border">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">Total Commutes completed</span>
              <span className="text-3xl font-extrabold text-white font-mono block mt-1">{stats?.totalTrips || 0}</span>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Leaf size={14} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Total CO₂ Saved</span>
              </div>
              <span className="text-3xl font-extrabold text-white font-mono block">{stats?.totalCarbonSaved || 0} kg</span>
            </Card>
            <Card className="bg-[#121212] border-border">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Navigation size={14} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Total Fleet Mileage</span>
              </div>
              <span className="text-3xl font-extrabold text-white font-mono block">{stats?.totalDistance || 0} km</span>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <div className="flex items-center gap-2 text-secondary mb-1">
                <Coins size={14} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Avg Cost Share</span>
              </div>
              <span className="text-3xl font-extrabold text-white font-mono block">₹{stats?.avgCostPerKm || 0} / km</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Drivers Aggregation */}
            <Card className="lg:col-span-2 bg-[#121212] border-border">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Top Drivers by Completed Commutes</h3>
              {(!stats || stats.topDrivers?.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  No driver logs recorded.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.topDrivers.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-[#222222]/20 border border-border/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-muted-foreground font-mono">#{idx+1}</div>
                        <div className="text-xs font-bold text-white">{item.driverName}</div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-bold text-white block">{item.tripsCount} trips</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{item.distanceCount.toFixed(1)} km driven</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Environmental Impact highlights */}
            <Card className="bg-[#121212] border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Leaf size={16} className="text-emerald-400" />
                Sustainability Impact
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                By grouping corporate commutes, your organization has saved <strong>{stats?.totalCarbonSaved || 0} kg of CO₂</strong> emissions this month.
              </p>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center">
                Equivalent to planting {Math.round((stats?.totalCarbonSaved || 0) / 22)} trees!
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <Card className="bg-[#121212] border-border">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Corporate Directory ({totalEmployees})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground uppercase font-medium tracking-wider">
                  <th className="pb-3 font-semibold">Emp Code</th>
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-[#222222]/10 transition-colors">
                    <td className="py-3.5 font-mono text-muted-foreground">{emp.employeeCode}</td>
                    <td className="py-3.5 font-bold text-white">{emp.name}</td>
                    <td className="py-3.5 font-mono text-muted-foreground">{emp.email}</td>
                    <td className="py-3.5">{emp.department || 'General'}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                        emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        variant={emp.status === 'active' ? 'outline' : 'primary'}
                        onClick={() => handleToggleStatus(emp._id, emp.status)}
                        className="py-1 px-3 text-[10px]"
                      >
                        {emp.status === 'active' ? 'Disable Access' : 'Enable Access'}
                      </Button>
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

      {/* Config Tab */}
      {activeTab === 'config' && (
        <Card className="bg-[#121212] border-border max-w-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-4">
            <Settings size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Carpool Cost Configurations</h3>
          </div>

          {configSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {configSuccess}
            </div>
          )}

          {configError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {configError}
            </div>
          )}

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
    </div>
  );
};

export default AdminDashboard;
