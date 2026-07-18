import React from 'react';
import { Check, MapPin, Play, Compass, Flag, CreditCard } from 'lucide-react';

const steps = [
  { status: 'booked', label: 'Confirmed', icon: MapPin },
  { status: 'started', label: 'Departed', icon: Play },
  { status: 'in_progress', label: 'On Route', icon: Compass },
  { status: 'completed', label: 'Arrived', icon: Flag },
  { status: 'payment_completed', label: 'Settled', icon: CreditCard }
];

export const Stepper = ({ currentStatus }) => {
  const getStatusIndex = (status) => {
    switch (status) {
      case 'booked': return 0;
      case 'started': return 1;
      case 'in_progress': return 2;
      case 'completed':
      case 'payment_pending': return 3;
      case 'payment_completed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="w-full py-6 px-4">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          
          return (
            <React.Fragment key={step.status}>
              {idx > 0 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${idx <= currentIndex ? 'bg-primary' : 'bg-border'}`} />
              )}
              <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isActive 
                      ? 'bg-card border-primary text-primary shadow-lg scale-110 shadow-primary/20' 
                      : 'bg-card border-border text-muted-foreground'
                }`}>
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`absolute top-12 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive ? 'text-primary font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
