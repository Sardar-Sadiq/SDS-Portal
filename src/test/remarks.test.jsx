import { describe, it, expect, beforeEach } from 'vitest';
import { isRemarkForEmployee, remarkService } from '@/modules/remarks/services/remarkService';

describe('Performance Remarks Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isRemarkForEmployee helper', () => {
    it('matches employee by employeeId', () => {
      const remark = { employeeId: 'SDS-1002', content: 'Great job' };
      const target = { employeeId: 'SDS-1002', name: 'Elena Rostova' };
      expect(isRemarkForEmployee(remark, target)).toBe(true);
    });

    it('matches employee by auth_id', () => {
      const remark = { employeeAuthId: 'uuid-1234', content: 'Well done' };
      const target = { auth_id: 'uuid-1234', name: 'Sardar' };
      expect(isRemarkForEmployee(remark, target)).toBe(true);
    });

    it('matches employee by email (case-insensitive)', () => {
      const remark = { employeeEmail: 'elena.r@spiritdatasolutions.com', content: 'Kudos' };
      const target = { email: 'ELENA.R@SPIRITDATASOLUTIONS.COM', name: 'Elena' };
      expect(isRemarkForEmployee(remark, target)).toBe(true);
    });

    it('returns false for non-matching employee', () => {
      const remark = { employeeId: 'SDS-1002', content: 'Great job' };
      const target = { employeeId: 'SDS-1005', name: 'David' };
      expect(isRemarkForEmployee(remark, target)).toBe(false);
    });
  });

  describe('remarkService persistence', () => {
    it('adds and retrieves remarks from local storage', async () => {
      const newRemark = {
        id: 'rem-test-1',
        employeeId: 'SDS-1002',
        content: 'Testing remark addition',
        category: 'PRAISE'
      };

      const updated = await remarkService.addRemark(newRemark);
      expect(updated.some(r => r.id === 'rem-test-1')).toBe(true);

      const fetched = await remarkService.fetchRemarks();
      expect(fetched.some(r => r.id === 'rem-test-1')).toBe(true);
    });

    it('deletes remark successfully', async () => {
      const remark = {
        id: 'rem-test-del',
        employeeId: 'SDS-1002',
        content: 'To be deleted'
      };
      await remarkService.addRemark(remark);

      const updated = await remarkService.deleteRemark('rem-test-del');
      expect(updated.some(r => r.id === 'rem-test-del')).toBe(false);
    });

    it('edits remark content and category', async () => {
      const remark = {
        id: 'rem-test-edit',
        employeeId: 'SDS-1002',
        content: 'Initial content',
        category: 'PRAISE'
      };
      await remarkService.addRemark(remark);

      const updated = await remarkService.editRemark('rem-test-edit', 'Updated content', 'IMPROVEMENT');
      const edited = updated.find(r => r.id === 'rem-test-edit');
      expect(edited.content).toBe('Updated content');
      expect(edited.category).toBe('IMPROVEMENT');
    });
  });
});
