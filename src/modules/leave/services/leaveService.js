import { supabase } from '@/lib/supabaseClient';

export const leaveService = {
  // Fetch leave applications from SDS_LeaveRequests or leave_requests table
  async fetchLeaveRequests({ employeeId, isAdmin }) {
    try {
      let data = null;

      // Try SDS_LeaveRequests first
      let res = await supabase
        .from('SDS_LeaveRequests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!res.error && res.data && res.data.length > 0) {
        data = res.data;
      } else {
        // Try sds_leaverequests fallback
        res = await supabase
          .from('sds_leaverequests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!res.error && res.data && res.data.length > 0) {
          data = res.data;
        } else {
          // Try leave_requests fallback
          res = await supabase
            .from('leave_requests')
            .select('*')
            .order('created_at', { ascending: false });
          if (!res.error && res.data) {
            data = res.data;
          }
        }
      }

      if (!data) return [];

      let list = data.map((row) => {
        const rawType = String(row.leave_type || row.leaveType || 'CASUAL').toUpperCase();
        const rawSlot = String(row.half_day_slot || row.halfDaySlot || row.half_day_session || '').toUpperCase();

        const isHalf = Boolean(
          row.is_half_day ||
          row.isHalfDay ||
          row.total_days === 0.5 ||
          row.totalDays === 0.5 ||
          rawType.includes('HALF')
        );

        let cleanType = rawType
          .replace('_HALF_SECOND_HALF', '')
          .replace('_HALF_FIRST_HALF', '')
          .replace('_HALF_DAY', '')
          .replace('HALF_DAY', '')
          .replace('HALF', '')
          .trim();
        if (!cleanType) cleanType = 'CASUAL';

        let slot = null;
        if (isHalf) {
          if (rawSlot.includes('SECOND') || rawSlot.includes('2ND') || rawSlot.includes('AFTERNOON') || rawType.includes('SECOND')) {
            slot = 'SECOND_HALF';
          } else if (rawSlot.includes('FIRST') || rawSlot.includes('1ST') || rawSlot.includes('MORNING') || rawType.includes('FIRST')) {
            slot = 'FIRST_HALF';
          } else {
            slot = rawSlot || 'FIRST_HALF';
          }
        }

        return {
          id: row.id,
          employeeId: row.employee_id || row.employeeId,
          employeeName: row.employee_name || row.employeeName || 'Staff',
          avatar: row.avatar || '',
          department: row.department || 'Engineering',
          leaveType: cleanType,
          startDate: row.start_date || row.startDate,
          endDate: row.end_date || row.endDate,
          totalDays: Number(row.total_days || row.totalDays || (isHalf ? 0.5 : 1)),
          isHalfDay: isHalf,
          halfDaySlot: slot,
          reason: row.reason || '',
          status: (row.status || 'PENDING').toUpperCase(),
          appliedOn: row.applied_on || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          reviewedBy: row.reviewed_by || row.reviewedBy,
          reviewedOn: row.reviewed_on || row.reviewedOn,
          adminNote: row.admin_note || row.adminNote
        };
      });

      if (!isAdmin && employeeId) {
        list = list.filter(r => r.employeeId === employeeId);
      }

      return list;
    } catch (err) {
      return [];
    }
  },

  // Submit a new leave application to Supabase
  async submitLeaveRequest(payload) {
    const fullRow = {
      employee_id: payload.employeeId,
      employee_name: payload.employeeName,
      avatar: payload.avatar ?? null,
      department: payload.department ?? null,
      leave_type: payload.leaveType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_days: payload.totalDays,
      is_half_day: payload.isHalfDay ?? false,
      half_day_slot: payload.halfDaySlot ?? null,
      reason: payload.reason,
      status: 'PENDING',
      applied_on: new Date().toISOString().split('T')[0]
    };

    const baseRow = {
      employee_id: payload.employeeId,
      employee_name: payload.employeeName,
      avatar: payload.avatar ?? null,
      department: payload.department ?? null,
      leave_type: payload.isHalfDay ? `${payload.leaveType}_HALF_${payload.halfDaySlot || 'FIRST_HALF'}` : payload.leaveType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_days: payload.totalDays,
      reason: payload.reason,
      status: 'PENDING',
      applied_on: new Date().toISOString().split('T')[0]
    };

    try {
      // Try full row on SDS_LeaveRequests
      let res = await supabase.from('SDS_LeaveRequests').insert([fullRow]).select();
      if (!res.error && res.data) return res.data;

      // Try base row on SDS_LeaveRequests
      res = await supabase.from('SDS_LeaveRequests').insert([baseRow]).select();
      if (!res.error && res.data) return res.data;

      // Try full row on sds_leaverequests
      res = await supabase.from('sds_leaverequests').insert([fullRow]).select();
      if (!res.error && res.data) return res.data;

      // Try base row on sds_leaverequests
      res = await supabase.from('sds_leaverequests').insert([baseRow]).select();
      if (!res.error && res.data) return res.data;

      // Try base row on leave_requests
      res = await supabase.from('leave_requests').insert([baseRow]).select();
      if (!res.error && res.data) return res.data;

      return null;
    } catch (err) {
      console.warn('submitLeaveRequest error:', err);
      return null;
    }
  },

  // Update leave request status (APPROVED / REJECTED)
  async updateRequestStatus({ id, status, reviewedBy, adminNote }) {
    const updateObj = {
      status: status.toUpperCase(),
      reviewed_by: reviewedBy,
      reviewed_on: new Date().toISOString().split('T')[0],
      admin_note: adminNote
    };

    try {
      await supabase
        .from('SDS_LeaveRequests')
        .update(updateObj)
        .eq('id', id);
    } catch (err) {
      try {
        await supabase.from('sds_leaverequests').update(updateObj).eq('id', id);
      } catch (e) {}
    }
  },

  // Fetch DB-calculated leave balances for current user
  async fetchBalances(authId) {
    if (!authId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authId);
    if (!isUuid) return null;

    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_auth_id', authId);

    if (error) return null;

    const balObj = { casual: 12, sick: 12, emergency: 10 };
    if (data && data.length > 0) {
      data.forEach(row => {
        let type = row.leave_type?.toLowerCase();
        if (type === 'annual') type = 'emergency';
        if (type && balObj[type] !== undefined) {
          balObj[type] = Number(row.balance);
        }
      });
    }
    return balObj;
  },

  // Record approved leave usage in ledger
  async recordUsage({ authId, leaveType, totalDays, startDate, endDate, isHalfDay }) {
    if (!authId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authId);
    if (!isUuid) return null;

    const daysUsed = Math.abs(Number(totalDays) || 1);
    const leaveNote = isHalfDay
      ? `Approved Half Day ${leaveType} leave (${startDate})`
      : `Approved ${leaveType} leave (${startDate} to ${endDate})`;

    const { data, error } = await supabase
      .from('leave_ledger')
      .insert([
        {
          employee_auth_id: authId,
          leave_type: leaveType.toLowerCase(),
          entry_type: 'usage',
          amount: -1 * daysUsed,
          note: leaveNote
        }
      ])
      .select();

    if (error) return null;
    return data;
  },

  // Real-time subscription to leave_requests & leave_ledger changes
  subscribeToLeaveChanges(onChange) {
    try {
      const channel = supabase
        .channel('realtime_leave_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'SDS_LeaveRequests' },
          (payload) => onChange(payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leave_ledger' },
          (payload) => onChange(payload)
        )
        .subscribe();

      return channel;
    } catch (err) {
      return { unsubscribe: () => {} };
    }
  },

  // Alias for backward compatibility
  subscribeToLedgerChanges(onChange) {
    return this.subscribeToLeaveChanges(onChange);
  }
};
