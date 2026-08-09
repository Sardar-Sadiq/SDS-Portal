'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export const AddRemarkModal = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  editingRemark = null
}) => {
  const { addRemark, editRemark } = useStore();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PRAISE');

  useEffect(() => {
    if (editingRemark) {
      setContent(editingRemark.content || '');
      setCategory(editingRemark.category || 'PRAISE');
    } else {
      setContent('');
      setCategory('PRAISE');
    }
  }, [editingRemark, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editingRemark) {
      editRemark(editingRemark.id, content, category);
      setContent('');
      onClose();
    } else {
      const success = addRemark(employeeId, content, category);
      if (success !== false) {
        setContent('');
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRemark ? `Edit Remark — ${employeeName}` : `Add Performance Remark — ${employeeName}`}
      description="Admin performance feedback log (Max 2 remarks allowed per employee)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
          >
            <option value="PRAISE">PRAISE (Recognition &amp; Kudos)</option>
            <option value="IMPROVEMENT">IMPROVEMENT (Constructive SLA Feedback)</option>
            <option value="GOAL">GOAL (Target &amp; Objective)</option>
            <option value="GENERAL">GENERAL (General Note)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Remark Content *</label>
          <textarea
            required
            rows={4}
            placeholder="Write clear, actionable performance feedback..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500 resize-none"
          />
        </div>

        <p className="text-[11px] text-neutral-400 font-mono">
          * Each employee is limited to a maximum of 2 active performance remarks.
        </p>

        <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editingRemark ? 'Update Remark' : 'Publish Remark'}</Button>
        </div>
      </form>
    </Modal>
  );
};
