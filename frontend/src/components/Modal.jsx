import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl relative flex flex-col max-h-[90vh] animate-scale-up ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 text-sm text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
