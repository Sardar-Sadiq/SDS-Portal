'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2 } from 'lucide-react';

export const EditEmployeeModal = ({ isOpen, onClose, employee }) => {
  const { updateEmployee } = useStore();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'IT',
    designation: '',
    phone: '',
    role: 'EMPLOYEE'
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeId: employee.employeeId || employee.id || '',
        name: employee.name || employee.full_name || '',
        email: employee.email || '',
        department: employee.department || 'IT',
        designation: employee.designation || '',
        phone: employee.phone || '',
        role: employee.role || 'EMPLOYEE'
      });
    }
  }, [employee]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.email || !employee) return;

    setSaving(true);
    try {
      await updateEmployee(employee.id || employee.employeeId, formData);
      onClose();
    } catch (err) {
      console.error('Failed to update employee:', err);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S or Cmd+S listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, employee]);

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Employee Profile"
      description="Update staff profile details and save changes to Supabase database"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Row 1: Employee ID & Full Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Employee ID
            </label>
            <input
              type="text"
              placeholder="e.g. 789123_IN"
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Lee"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 font-medium"
            />
          </div>
        </div>

        {/* Row 2: Work Email & Department */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Work Email *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. jordan.l@spiritdatasolutions.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Department
            </label>
            <select
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value="IT">IT</option>
              <option value="Non IT">Non IT</option>
              <option value="Engineering">Engineering</option>
              <option value="Data Science">Data Science</option>
              <option value="DevOps & Infrastructure">DevOps &amp; Infrastructure</option>
              <option value="Product & Design">Product &amp; Design</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
        </div>

        {/* Row 3: Designation & Phone Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Designation
            </label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={formData.designation}
              onChange={e => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 font-mono"
            />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
          <Badge variant="outline" className="font-mono text-[10px] text-neutral-400">
            Tip: Press Ctrl+S to save
          </Badge>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
