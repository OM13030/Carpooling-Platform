import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export const SettingCard = ({ to, icon: Icon, title, description, badge }) => {
  return (
    <Link to={to} aria-label={title} className="group block">
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="bg-[#121212] border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm transition-all group-hover:border-primary/35 group-hover:shadow-lg group-hover:shadow-black/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-semibold text-white truncate">{title}</h3>
              {badge ? (
                <span className="text-[10px] uppercase tracking-[0.24em] bg-[#222222] text-muted-foreground px-2.5 py-1 rounded-full">
                  {badge}
                </span>
              ) : null}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>

          <div className="text-muted-foreground group-hover:text-white transition-transform duration-200 group-hover:translate-x-1">
            <ChevronRight size={18} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default SettingCard;