'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export const AddEmployeeModal = ({ isOpen, onClose }) => {
  const { addEmployee, officeSettings } = useStore();
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'IT',
    designation: 'Software Engineer',
    role: 'EMPLOYEE',
    phone: '',
    manager: 'Sardar Sadiq'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const empId = formData.employeeId?.trim() || `${Math.floor(100000 + Math.random() * 900000)}_IN`;

    addEmployee({
      employeeId: empId,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      designation: formData.designation || 'Software Engineer',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: formData.phone || '',
      manager: formData.manager,
      officeLocation: officeSettings?.geoFence,
      leaveBalance: { casual: 12, sick: 12, emergency: 10 }
    });

    onClose();
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      department: 'IT',
      designation: 'Software Engineer',
      role: 'EMPLOYEE',
      phone: '',
      manager: 'Sardar Sadiq'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" description="Register a new staff member into Spirit Data Solutions directory">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: ID & Full Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Employee ID</label>
            <input
              type="text"
              placeholder="e.g. 789123_IN"
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
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
        </div>

        {/* Row 2: Work Email & Department */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Work Email *</label>
            <input
              type="email"
              required
              placeholder="e.g. jordan.l@spiritdatasolutions.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Department</label>
            <select
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value="IT">IT</option>
              <option value="Non IT">Non IT</option>
            </select>
          </div>
        </div>

        {/* Row 3: Designation & Phone Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Designation</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={formData.designation}
              onChange={e => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
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
