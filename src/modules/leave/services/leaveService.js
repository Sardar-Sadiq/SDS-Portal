import { supabase } from '@/lib/supabaseClient';

export const leaveService = {
  // Fetch leave applications from SDS_LeaveRequests or leave_requests table
  async fetchLeaveRequests({ employeeId, isAdmin }) {
    try {
      let { data, error } = await supabase
        .from('SDS_LeaveRequests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback to lowercase table name 'leave_requests' or 'sds_leaverequests'
        const fallback = await supabase
          .from('sds_leaverequests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fallback.error && fallback.data) {
          data = fallback.data;
          error = null;
        }
      }

      if (error || !data) return [];

      let list = data.map((row) => ({
        id: row.id,
        employeeId: row.employee_id || row.employeeId,
        employeeName: row.employee_name || row.employeeName || 'Staff',
        avatar: row.avatar || '',
        department: row.department || 'Engineering',
        leaveType: (row.leave_type || row.leaveType || 'CASUAL').toUpperCase(),
        startDate: row.start_date || row.startDate,
        endDate: row.end_date || row.endDate,
        totalDays: Number(row.total_days || row.totalDays || 1),
        reason: row.reason || '',
        status: (row.status || 'PENDING').toUpperCase(),
        appliedOn: row.applied_on || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        reviewedBy: row.reviewed_by || row.reviewedBy,
        reviewedOn: row.reviewed_on || row.reviewedOn,
        adminNote: row.admin_note || row.adminNote
      }));

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
    const rowObj = {
      employee_id: payload.employeeId,
      employee_name: payload.employeeName,
      avatar: payload.avatar ?? null,
      department: payload.department ?? null,
      leave_type: payload.leaveType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_days: payload.totalDays,
      reason: payload.reason,
      status: 'PENDING',
      applied_on: new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await supabase
        .from('SDS_LeaveRequests')
        .insert([rowObj])
        .select();

      if (error) {
        // Fallback try lowercase
        await supabase.from('sds_leaverequests').insert([rowObj]);
      }
      return data;
    } catch (err) {
      console.warn('submitLeaveRequest fallback:', err);
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
  async recordUsage({ authId, leaveType, totalDays, startDate, endDate }) {
    if (!authId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authId);
    if (!isUuid) return null;

    const { data, error } = await supabase
      .from('leave_ledger')
      .insert([
        {
          employee_auth_id: authId,
          leave_type: leaveType.toLowerCase(),
          entry_type: 'usage',
          amount: -1 * Math.abs(totalDays),
          note: `Approved ${leaveType} leave (${startDate} to ${endDate})`
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
