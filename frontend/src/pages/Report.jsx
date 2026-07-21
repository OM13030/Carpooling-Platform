import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import apiClient from '../api/apiClient';
import { 
  TrendingUp, Activity, Fuel, AlertCircle, Plus, 
  Calendar, Car, DollarSign, ListFilter, HelpCircle 
} from 'lucide-react';

export const Report = () => {
  // Date range defaults to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  // Data state
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    vehicleId: '',
    type: 'maintenance',
    amount: '',
    incurredOn: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Load vehicles lists
  const loadVehicles = async () => {
    try {
      const { data } = await apiClient.get('/vehicles');
      setVehicles(data.data);
      if (data.data.length > 0 && !expenseForm.vehicleId) {
        setExpenseForm(prev => ({ ...prev, vehicleId: data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load vehicles', err);
    }
  };

  // Fetch report data from API
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/reports/employee/summary', {
        params: {
          from: startDate,
          to: endDate,
          vehicleId: selectedVehicleId || undefined
        }
      });
      setReportData(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedVehicleId]);

  // Log a new expense
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    if (!expenseForm.vehicleId || !expenseForm.amount) {
      setModalError('Vehicle and amount are required');
      setModalLoading(false);
      return;
    }

    try {
      await apiClient.post('/vehicle-expenses', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      setModalSuccess('Expense logged successfully!');
      setTimeout(() => {
        setShowExpenseModal(false);
        setModalSuccess('');
        setExpenseForm({
          vehicleId: vehicles[0]?._id || '',
          type: 'maintenance',
          amount: '',
          incurredOn: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchReport(); // reload report metrics
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to register expense');
    } finally {
      setModalLoading(false);
    }
  };

  // UI Theme details
  const COLORS = ['#e78a53', '#5f8787', '#fbcb97', '#999999', '#888888'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">History & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics on your personal vehicle operating expenditures, usage, and ride revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowExpenseModal(true)} 
            variant="primary" 
            className="text-xs py-2 px-4 font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={15} /> Log Expense
          </Button>
        </div>
      </div>

      {/* Filters block */}
      <Card className="bg-[#121212] border-border p-4 mb-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2 flex-1">
            <Calendar size={14} className="text-primary" />
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Date Range:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#222222] border border-border rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-primary"
            />
            <span className="text-muted-foreground">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#222222] border border-border rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Car size={14} className="text-primary" />
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Filter Vehicle:</span>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-[#222222] border border-border rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Vehicles (Fleet Average)</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>{v.manufacturer} {v.model} ({v.registrationNumber})</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-medium mb-6">
          {error}
        </div>
      )}

      {loading ? (
        // Skeleton loader
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[#121212] border border-border animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-[#121212] border border-border animate-pulse rounded-xl" />
            <div className="h-80 bg-[#121212] border border-border animate-pulse rounded-xl" />
          </div>
        </div>
      ) : error || !reportData ? (
        <div className="bg-[#121212] border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <AlertCircle size={36} className="text-red-400 mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Failed to load reports</h3>
          <p className="text-xs text-muted-foreground max-w-sm">{error || 'Report summary data is not available.'}</p>
          <Button onClick={fetchReport} variant="outline" className="mt-4 text-xs cursor-pointer">Try Again</Button>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#121212] border-border p-5 flex items-center justify-between relative overflow-hidden">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Fuel Cost</span>
                <h3 className="text-2xl font-bold text-white mt-1">₹{reportData?.kpis.totalFuelCost.toLocaleString()}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Driven fuel spend in range</p>
              </div>
              <div className="bg-[#222222] p-3 rounded-xl text-primary border border-border/60">
                <Fuel size={20} />
              </div>
            </Card>

            <Card className="bg-[#121212] border-border p-5 flex items-center justify-between relative overflow-hidden">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fleet ROI</span>
                <h3 className={`text-2xl font-bold mt-1 ${reportData?.kpis.fleetROI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {reportData?.kpis.fleetROI}%
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">Return on vehicle operating cost</p>
              </div>
              <div className="bg-[#222222] p-3 rounded-xl text-primary border border-border/60">
                <TrendingUp size={20} />
              </div>
            </Card>

            <Card className="bg-[#121212] border-border p-5 flex items-center justify-between relative overflow-hidden">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Utilization Rate</span>
                <h3 className="text-2xl font-bold text-white mt-1">{reportData?.kpis.utilizationRate}%</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Trips completed / published</p>
              </div>
              <div className="bg-[#222222] p-3 rounded-xl text-primary border border-border/60">
                <Activity size={20} />
              </div>
            </Card>
          </div>

          {/* Charts panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Chart 1: Fuel Efficiency Trend */}
            <Card className="bg-[#121212] border-border p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[10px] border-b border-border/40 pb-2">Fuel Efficiency Trend</h3>
              {reportData?.fuelEfficiencyTrend.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground">
                  <AlertCircle size={20} className="mb-2 text-primary" />
                  No fuel efficiency data in this range.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.fuelEfficiencyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="period" stroke="#888" style={{ fontSize: 10 }} />
                      <YAxis stroke="#888" style={{ fontSize: 10 }} label={{ value: 'km/L', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 10 } }} />
                      <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '8px', fontSize: 11 }} />
                      <Line type="monotone" dataKey="efficiency" name="Efficiency" stroke="#e78a53" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 2: Weekly Profit */}
            <Card className="bg-[#121212] border-border p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[10px] border-b border-border/40 pb-2">Weekly Profit summary</h3>
              {reportData?.weeklyProfit.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground">
                  <AlertCircle size={20} className="mb-2 text-primary" />
                  No trip profit data recorded.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.weeklyProfit} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="week" stroke="#888" style={{ fontSize: 10 }} />
                      <YAxis stroke="#888" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '8px', fontSize: 11 }} formatter={(value) => [`₹${value}`, 'Net Profit']} />
                      <Bar dataKey="profit" fill="#e78a53" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 3: Costliest Vehicles */}
            <Card className="bg-[#121212] border-border p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[10px] border-b border-border/40 pb-2">Top 5 Costliest Vehicles</h3>
              {reportData?.topCostliestVehicles.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground">
                  <AlertCircle size={20} className="mb-2 text-primary" />
                  No vehicle expenses logged.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.topCostliestVehicles} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis type="number" stroke="#888" style={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke="#888" style={{ fontSize: 9 }} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '8px', fontSize: 11 }} formatter={(value) => [`₹${value}`, 'Total Cost']} />
                      <Bar dataKey="cost" fill="#5f8787" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Chart 4: Vehicle Usage (Donut Chart) */}
            <Card className="bg-[#121212] border-border p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[10px] border-b border-border/40 pb-2">Vehicle Usage Shares</h3>
              
              {reportData?.vehicleUsage.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground">
                  <AlertCircle size={20} className="mb-2 text-primary" />
                  No vehicle usage recorded.
                </div>
              ) : (
                <div className="h-64 flex flex-col sm:flex-row items-center justify-between">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.vehicleUsage}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {reportData.vehicleUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '8px', fontSize: 11 }} formatter={(value) => [`${value} Rides`, 'Usage']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2 mt-4 sm:mt-0">
                    {reportData.vehicleUsage.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-white truncate font-medium max-w-[120px]">{entry.name}</span>
                        <span className="text-muted-foreground font-mono">({entry.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Financial Summary Table */}
          <Card className="bg-[#121212] border-border p-5 mb-8">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[10px] border-b border-border/40 pb-2">Monthly Financial Ledger</h3>
            
            {reportData?.monthlyFinancials.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No financial history found in range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="py-2.5">Month</th>
                      <th className="py-2.5 text-right">Revenue</th>
                      <th className="py-2.5 text-right">Fuel Cost</th>
                      <th className="py-2.5 text-right">Maintenance</th>
                      <th className="py-2.5 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyFinancials.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/20 last:border-b-0 hover:bg-[#222222]/10 transition-colors">
                        <td className="py-3 font-semibold text-white">{row.month}</td>
                        <td className="py-3 text-right text-emerald-400 font-bold">₹{row.revenue.toLocaleString()}</td>
                        <td className="py-3 text-right text-red-400">₹{row.fuelCost.toLocaleString()}</td>
                        <td className="py-3 text-right text-muted-foreground">₹{row.maintenance.toLocaleString()}</td>
                        <td className="py-3 text-right text-white font-extrabold">₹{row.netProfit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Log Expense Dialog Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-[#121212] border border-border shadow-2xl p-6">
            <h3 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wider">Log Vehicle Operating Expense</h3>
            
            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs mb-4">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Select Vehicle *</label>
                <select
                  value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Choose vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.manufacturer} {v.model} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Expense Type *</label>
                  <select
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="insurance">Insurance</option>
                    <option value="fuel">Fuel (Extra)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Incurred On *</label>
                <input
                  type="date"
                  value={expenseForm.incurredOn}
                  onChange={(e) => setExpenseForm({ ...expenseForm, incurredOn: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes / Description</label>
                <textarea
                  placeholder="Notes about maintenance, filters, oil, brake pads..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-white focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowExpenseModal(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1"
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Saving...' : 'Register'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Report;
