import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Search, Mail, ShieldAlert, PhoneCall, AlertTriangle, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const HelpCenter = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ticket form state
  const [category, setCategory] = useState('billing');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/help/faqs');
      setFaqs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch FAQs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setTicketSuccess('');
    setTicketError('');
    setSubmitting(true);

    try {
      await apiClient.post('/help/ticket', { category, subject, message });
      setTicketSuccess('Support ticket raised successfully! Our team will contact you soon.');
      setSubject('');
      setMessage('');
    } catch (err) {
      setTicketError(err.response?.data?.message || 'Failed to raise support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <HelpCircle size={14} /> Help
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Help Center</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Search FAQs, check guidelines, review platform terms, and raise direct support tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FAQs and Search */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-[#121212] border-border/70 p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Frequently Asked Questions</h3>
              
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none"
                />
                <Search size={14} className="absolute left-3 top-2 text-muted-foreground" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No matching questions found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id || faq.question} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                    <div className="font-bold text-xs text-white mb-2">{faq.question}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Emergency contacts card */}
          <Card className="bg-[#121212] border-red-500/20 p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-red-500/10 pb-4">
              <ShieldAlert size={18} className="text-red-400" />
              <h3 className="font-bold text-sm text-red-400 uppercase tracking-wider">Emergency Support</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              If you feel unsafe during a ride or are involved in an incident, use our emergency helpline links below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#222222]/30 border border-border/40 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                  <PhoneCall size={14} />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Helpline No.</span>
                  <span className="text-xs font-bold text-white">+91 9999 888 888</span>
                </div>
              </div>

              <div className="p-3 bg-[#222222]/30 border border-border/40 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Safety Desk</span>
                  <span className="text-xs font-bold text-white">safety@gopool.com</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Raise Ticket Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#121212] border-border/70 p-5">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Raise a Ticket</h3>

            {ticketSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
                {ticketSuccess}
              </div>
            )}

            {ticketError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
                {ticketError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="billing">Billing & Refund</option>
                  <option value="app_bug">App Bug / Technical issue</option>
                  <option value="driver_conduct">Driver / Commuter conduct</option>
                  <option value="other">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Message Details</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Explain details here (min 10 characters)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Raise Ticket
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default HelpCenter;
