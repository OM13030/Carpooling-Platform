import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const FeatureModulePage = ({ title, subtitle, accent, emptyTitle, emptyDescription, actionLabel, actionTo }) => {
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
            <Sparkles size={14} /> {accent}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">{title}</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
        </div>

        <Link to={actionTo}>
          <Button className="min-w-[160px]">
            {actionLabel}
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      <Card className="bg-[#121212] border-border/70 p-6 md:p-8">
        <div className="rounded-2xl border border-dashed border-border/70 bg-[#222222]/20 p-6 md:p-10 text-center">
          <div className="text-lg font-semibold text-white">{emptyTitle}</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed">{emptyDescription}</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link to={actionTo}>
              <Button>{actionLabel}</Button>
            </Link>
            <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              Open Settings
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FeatureModulePage;