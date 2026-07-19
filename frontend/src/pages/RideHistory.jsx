import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, History, Filter, Download, Star, Calendar, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const RideHistory = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters State
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/trips/history');
      const history = data.data || [];
      setTrips(history);
      setFilteredTrips(history);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ride history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let result = [...trips];
    const now = new Date();

    if (timeFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(t => new Date(t.createdAt) >= oneWeekAgo);
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(t => new Date(t.createdAt) >= oneMonthAgo);
    } else if (timeFilter === 'custom') {
      if (startDate) {
        result = result.filter(t => new Date(t.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(t => new Date(t.createdAt) <= end);
      }
    }

    setFilteredTrips(result);
  }, [timeFilter, startDate, endDate, trips]);

  const handleExportCSV = () => {
    if (filteredTrips.length === 0) return;

    const headers = ['Date', 'Trip ID', 'Driver', 'Status', 'Distance (Km)', 'Duration (Min)', 'Amount (₹)'];
    const rows = filteredTrips.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t._id,
      t.driverId?.name || 'N/A',
      t.status,
      t.distanceKm || '0',
      t.durationMin || '0',
      t.distanceKm ? Math.round(t.distanceKm * 5) : '100'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ride_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <History size={14} /> History
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Ride History</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Review completed and cancelled rides, analyze travel distance & duration statistics, and export transactions.
          </p>
        </div>

        <Button onClick={handleExportCSV} disabled={filteredTrips.length === 0} className="min-w-[160px]">
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <Card className="bg-[#121212] border-border/70 p-5 mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Filter size={14} className="text-primary" /> Filter History
          </div>

          <div className="flex gap-2">
            {[
              { label: 'All Time', val: 'all' },
              { label: 'Last Week', val: 'week' },
              { label: 'Last Month', val: 'month' },
              { label: 'Custom Range', val: 'custom' }
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setTimeFilter(f.val)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  timeFilter === f.val 
                    ? 'bg-primary/10 border-primary/30 text-white' 
                    : 'bg-[#222222]/30 border-border/60 text-muted-foreground hover:text-black'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {timeFilter === 'custom' && (
          <div className="flex flex-wrap gap-4 items-center border-t border-border/40 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-[#222222] border border-border rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-[#222222] border border-border rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </Card>

      {/* History List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <Card className="bg-[#121212] border-border/70 p-10 text-center text-muted-foreground">
          No ride records found matching the criteria.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((t) => (
            <Card key={t._id} className="bg-[#121212] border-border/70 p-5 hover:border-primary/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-xs text-white font-semibold font-mono">
                    {new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  t.status === 'completed' || t.status === 'payment_completed'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Distance</span>
                  <span className="text-white font-bold">{t.distanceKm || '0'} Km</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Duration</span>
                  <span className="text-white font-bold">{t.durationMin || '0'} Min</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Amount Settled</span>
                  <span className="text-white font-bold text-primary">₹{t.distanceKm ? Math.round(t.distanceKm * 5) : 100}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Driver Name</span>
                  <span className="text-white font-bold">{t.driverId?.name || 'Driver'}</span>
                </div>
              </div>

              {t.status === 'completed' && (
                <div className="border-t border-border/40 pt-4 mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">Ride Rating:</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={12} className={star <= 4 ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                      ))}
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Ref: {t._id.slice(-8)}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RideHistory;
