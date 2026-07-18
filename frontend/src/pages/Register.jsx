import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import apiClient from '../api/apiClient';
import { Landmark, User, Car } from 'lucide-react';

export const Register = ({ registerOrgOnly = false }) => {
  const [isOrgTab, setIsOrgTab] = useState(registerOrgOnly);
  const [orgs, setOrgs] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');

  // Employee Form State
  const [empData, setEmpData] = useState({
    organizationId: '',
    employeeCode: '',
    name: '',
    email: '',
    mobile: '',
    password: '',
    department: '',
    officeLocation: '',
    designation: '',
    emergencyContact: ''
  });

  // Org Form State
  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    industry: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const navigate = useNavigate();
  const { registerEmployee, registerOrg, loading, error } = useAuthStore();

  useEffect(() => {
    // Load organizations
    const fetchOrgs = async () => {
      try {
        const { data } = await apiClient.get('/auth/organizations');
        setOrgs(data.data);
        if (data.data.length > 0) {
          setEmpData(prev => ({ ...prev, organizationId: data.data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    fetchOrgs();
  }, []);

  const handleEmpChange = (e) => {
    setEmpData({ ...empData, [e.target.name]: e.target.value });
  };

  const handleOrgChange = (e) => {
    setOrgData({ ...orgData, [e.target.name]: e.target.value });
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    if (!empData.organizationId || !empData.employeeCode || !empData.name || !empData.email || !empData.mobile || !empData.password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    const result = await registerEmployee(empData);
    if (result.success) {
      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    if (!orgData.name || !orgData.email || !orgData.adminName || !orgData.adminEmail || !orgData.adminPassword) {
      setLocalError('Please fill in all required fields');
      return;
    }

    const result = await registerOrg(orgData);
    if (result.success) {
      setSuccessMsg('Organization & Admin account registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#121113] text-[#c1c1c1] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

      <Card className="w-full max-w-2xl bg-[#121212] border-border/80 shadow-xl overflow-hidden p-0">
        {/* Branding header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-primary w-5 h-5" />
            <span className="font-bold text-sm tracking-wider font-mono text-white">COMMUTE.ENT</span>
          </div>
          <Link to="/login" className="text-xs text-primary font-semibold hover:underline">
            Already have an account? Sign In
          </Link>
        </div>

        {/* Tab Headers */}
        <div className="flex bg-[#222222]/40 border-b border-border">
          <button
            onClick={() => { setIsOrgTab(false); setLocalError(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              !isOrgTab ? 'border-primary text-white font-bold bg-[#222222]/10' : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <User size={14} />
            Employee Registration
          </button>
          <button
            onClick={() => { setIsOrgTab(true); setLocalError(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              isOrgTab ? 'border-primary text-white font-bold bg-[#222222]/10' : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Landmark size={14} />
            Register Organization
          </button>
        </div>

        <div className="p-8">
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold mb-6">
              {successMsg}
            </div>
          )}

          {(localError || error) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold mb-6">
              {localError || error}
            </div>
          )}

          {!isOrgTab ? (
            /* Employee Registration Form */
            <form onSubmit={handleEmployeeSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Select Organization *</label>
                  <select
                    name="organizationId"
                    value={empData.organizationId}
                    onChange={handleEmpChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {orgs.length === 0 ? (
                      <option value="">No organizations registered yet</option>
                    ) : (
                      orgs.map(org => (
                        <option key={org._id} value={org._id}>{org.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Employee Code *</label>
                  <input
                    type="text"
                    name="employeeCode"
                    placeholder="e.g. EMP1024"
                    value={empData.employeeCode}
                    onChange={handleEmpChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Aarav Patel"
                    value={empData.name}
                    onChange={handleEmpChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Corporate Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="aarav.p@company.com"
                    value={empData.email}
                    onChange={handleEmpChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="+91 XXXXX XXXXX"
                    value={empData.mobile}
                    onChange={handleEmpChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Password *</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={empData.password}
                    onChange={handleEmpChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border/40 my-4 pt-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-4">Workplace Details (Optional)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      placeholder="e.g. Engineering"
                      value={empData.department}
                      onChange={handleEmpChange}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      placeholder="e.g. Software Architect"
                      value={empData.designation}
                      onChange={handleEmpChange}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 font-bold"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Register Account'}
              </Button>
            </form>
          ) : (
            /* Organization Onboarding Form */
            <form onSubmit={handleOrgSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Organization Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. KSV Technologies"
                    value={orgData.name}
                    onChange={handleOrgChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Org Contact Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="info@ksvtech.com"
                    value={orgData.email}
                    onChange={handleOrgChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Org Head Office Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Gandhinagar, Gujarat"
                    value={orgData.address}
                    onChange={handleOrgChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Org Industry Type</label>
                  <input
                    type="text"
                    name="industry"
                    placeholder="e.g. Finance, Technology"
                    value={orgData.industry}
                    onChange={handleOrgChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border/40 my-4 pt-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-4">Initial Administrator Credentials</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Admin Full Name *</label>
                    <input
                      type="text"
                      name="adminName"
                      placeholder="e.g. Suresh Kumar"
                      value={orgData.adminName}
                      onChange={handleOrgChange}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Admin Login Email *</label>
                    <input
                      type="email"
                      name="adminEmail"
                      placeholder="admin@ksvtech.com"
                      value={orgData.adminEmail}
                      onChange={handleOrgChange}
                      className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Admin Password *</label>
                  <input
                    type="password"
                    name="adminPassword"
                    placeholder="••••••••"
                    value={orgData.adminPassword}
                    onChange={handleOrgChange}
                    className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 font-bold"
                disabled={loading}
              >
                {loading ? 'Processing Onboarding...' : 'Onboard Organization'}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Register;
