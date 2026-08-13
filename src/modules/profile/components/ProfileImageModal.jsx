'use client';

import React, { useEffect } from 'react';
import { X, ShieldCheck, Mail, Phone, Building2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileImageModal = ({ isOpen, onClose, employee }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const name = employee.name || employee.full_name || 'Staff Member';
  const empId = employee.employeeId || employee.id || 'SDS-Staff';
  const designation = employee.designation || 'Staff';
  const department = employee.department || 'IT';
  const email = employee.email || '';
  const phone = employee.phone || '';
  const role = (employee.role || 'EMPLOYEE').toUpperCase();
  const imageSrc = employee.card_image || employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        />

        {/* Identity Card Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-white my-auto"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-950/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> SDS Verified Staff Identity
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              title="Close overlay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Card Image Display */}
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group max-w-[260px] w-full">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-30 blur group-hover:opacity-50 transition duration-300" />
              <img
                src={imageSrc}
                alt={name}
                className="relative rounded-2xl w-full max-h-[340px] object-cover border border-neutral-700 shadow-2xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
                }}
              />
            </div>

            {/* Employee Name & ID */}
            <div className="space-y-1 w-full pt-1">
              <h3 className="text-xl font-bold text-white tracking-tight">{name}</h3>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  {empId}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold">
                  {role}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="w-full bg-neutral-950/80 rounded-2xl p-4 border border-neutral-800/80 space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-neutral-400" /> Designation:
                </span>
                <span className="font-semibold text-white">{designation}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" /> Department:
                </span>
                <span className="font-semibold text-white">{department}</span>
              </div>
              {email && (
                <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                  <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" /> Email:
                  </span>
                  <span className="font-mono text-neutral-200 truncate max-w-[190px]">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" /> Contact Phone:
                  </span>
                  <span className="font-mono text-neutral-200">{phone}</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
            >
              Close Identity Overlay
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
