'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export const AddEmployeeModal = ({ isOpen, onClose }) => {
  const { addEmployee, officeSettings } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: officeSettings.departments[0] || 'Engineering',
    designation: '',
    role: 'EMPLOYEE',
    phone: '',
    manager: 'Sardar Sadiq'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.designation) return;

    const nextIdNumber = Math.floor(1000 + Math.random() * 9000);
    addEmployee({
      employeeId: `SDS-${nextIdNumber}`,
      name: formData.name,
      email: formData.email,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random()*1000)}?w=150&auto=format&fit=crop&q=80`,
      role: formData.role,
      department: formData.department,
      designation: formData.designation,
      joiningDate: new Date().toISOString().split('T')[0],
      phone: formData.phone || '+1 (555) 000-0000',
      manager: formData.manager,
      officeLocation: officeSettings.geoFence,
      leaveBalance: { casual: 6, sick: 10, annual: 15 }
    });

    onClose();
    setFormData({
      name: '',
      email: '',
      department: officeSettings.departments[0] || 'Engineering',
      designation: '',
      role: 'EMPLOYEE',
      phone: '',
      manager: 'Sardar Sadiq'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" description="Register a new staff member into Spirit Data Solutions directory">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Lee"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Work Email *</label>
            <input
              type="email"
              required
              placeholder="jordan.l@spiritdatasolutions.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Department</label>
            <select
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              {officeSettings.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Designation *</label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineer"
              value={formData.designation}
              onChange={e => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Role Permission</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value="EMPLOYEE">EMPLOYEE (Standard Access)</option>
              <option value="ADMIN">ADMIN (Full Management Access)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Register Employee</Button>
        </div>
      </form>
    </Modal>
  );
};
