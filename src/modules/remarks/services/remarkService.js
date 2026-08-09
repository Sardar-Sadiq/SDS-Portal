import { supabase } from '@/lib/supabaseClient';
import { INITIAL_REMARKS } from '@/lib/mock-data';

const STORAGE_KEY = 'sds_remarks_ledger_v2';
let tableCheckAttempted = false;
let isRemarksTableAvailable = false;
let activeTableName = 'SDS_Remarks';

const getLocalRemarks = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return INITIAL_REMARKS;
};

const saveLocalRemarks = (remarksList) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remarksList));
  } catch (e) {}
};

export const remarkService = {
  // Fetch remarks from local storage & sync with DB if table exists in Supabase
  async fetchRemarks() {
    let localList = getLocalRemarks();

    // If we already verified the table doesn't exist, return local storage directly without triggering 404s
    if (tableCheckAttempted && !isRemarksTableAvailable) {
      return localList;
    }

    try {
      let { data, error } = await supabase
        .from('SDS_Remarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        tableCheckAttempted = true;
        isRemarksTableAvailable = true;
        activeTableName = 'SDS_Remarks';
      } else {
        // Try fallback table name 'sds_remarks'
        const fallback = await supabase
          .from('sds_remarks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fallback.error && fallback.data) {
          data = fallback.data;
          error = null;
          tableCheckAttempted = true;
          isRemarksTableAvailable = true;
          activeTableName = 'sds_remarks';
        } else {
          // Table does not exist in Supabase DB schema
          tableCheckAttempted = true;
          isRemarksTableAvailable = false;
        }
      }

      if (isRemarksTableAvailable && data && data.length > 0) {
        const dbRemarks = data.map(r => ({
          id: r.id || `rem-${Date.now()}`,
          employeeId: r.employee_id || r.employeeId,
          employeeAuthId: r.employee_auth_id || r.employeeAuthId,
          employeeEmail: r.employee_email || r.employeeEmail,
          authorId: r.author_id || r.authorId,
          authorName: r.author_name || r.authorName || 'Admin',
          authorRole: r.author_role || r.authorRole || 'ADMIN',
          content: r.content,
          category: r.category || 'PRAISE',
          createdAt: r.created_at || r.createdAt || new Date().toISOString()
        }));

        const map = new Map();
        [...dbRemarks, ...localList].forEach(item => {
          if (item && item.id) map.set(item.id, item);
        });
        const merged = Array.from(map.values());
        saveLocalRemarks(merged);
        return merged;
      }
    } catch (err) {
      tableCheckAttempted = true;
      isRemarksTableAvailable = false;
    }
    return localList;
  },

  // Save new performance remark
  async addRemark(payload) {
    const newRemark = {
      id: payload.id || `rem-${Date.now()}`,
      employeeId: payload.employeeId,
      employeeAuthId: payload.employeeAuthId || null,
      employeeEmail: payload.employeeEmail || null,
      authorId: payload.authorId || 'SDS-1001',
      authorName: payload.authorName || 'Sardar Sadiq',
      authorRole: payload.authorRole || 'ADMIN',
      content: payload.content,
      category: payload.category || 'PRAISE',
      createdAt: payload.createdAt || new Date().toISOString()
    };

    const current = getLocalRemarks();
    const updated = [newRemark, ...current.filter(r => r.id !== newRemark.id)];
    saveLocalRemarks(updated);

    if (isRemarksTableAvailable) {
      try {
        const rowObj = {
          id: newRemark.id,
          employee_id: newRemark.employeeId,
          employee_auth_id: newRemark.employeeAuthId,
          employee_email: newRemark.employeeEmail,
          author_id: newRemark.authorId,
          author_name: newRemark.authorName,
          author_role: newRemark.authorRole,
          content: newRemark.content,
          category: newRemark.category,
          created_at: newRemark.createdAt
        };
        await supabase.from(activeTableName).insert([rowObj]);
      } catch (err) {}
    }

    return updated;
  },

  // Edit existing remark
  async editRemark(remarkId, content, category) {
    const current = getLocalRemarks();
    const updated = current.map(r => r.id === remarkId ? { ...r, content, category } : r);
    saveLocalRemarks(updated);

    if (isRemarksTableAvailable) {
      try {
        const updateObj = { content, category };
        await supabase.from(activeTableName).update(updateObj).eq('id', remarkId);
      } catch (err) {}
    }

    return updated;
  },

  // Delete existing remark
  async deleteRemark(remarkId) {
    const current = getLocalRemarks();
    const updated = current.filter(r => r.id !== remarkId);
    saveLocalRemarks(updated);

    if (isRemarksTableAvailable) {
      try {
        await supabase.from(activeTableName).delete().eq('id', remarkId);
      } catch (err) {}
    }

    return updated;
  },

  // Real-time subscription to remarks table (only if DB table exists)
  subscribeToRemarkChanges(onChange) {
    if (!isRemarksTableAvailable) {
      return { unsubscribe: () => {} };
    }
    try {
      const channel = supabase
        .channel('realtime_remarks_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: activeTableName },
          (payload) => onChange(payload)
        )
        .subscribe();

      return channel;
    } catch (err) {
      return { unsubscribe: () => {} };
    }
  }
};

// Helper: Check if a remark is addressed to a given target employee/user object
export const isRemarkForEmployee = (remark, target) => {
  if (!remark || !target) return false;

  const remEmpId = String(remark.employeeId || '').toLowerCase().trim();
  const remAuthId = String(remark.employeeAuthId || '').toLowerCase().trim();
  const remEmail = String(remark.employeeEmail || '').toLowerCase().trim();

  const targetEmpId = String(target.employeeId || '').toLowerCase().trim();
  const targetId = String(target.id || '').toLowerCase().trim();
  const targetAuthId = String(target.auth_id || target.authId || '').toLowerCase().trim();
  const targetEmail = String(target.email || '').toLowerCase().trim();

  // 1. Direct match on employeeId
  if (remEmpId && (remEmpId === targetEmpId || remEmpId === targetId || remEmpId === targetAuthId)) return true;
  
  // 2. Match on auth_id
  if (remAuthId && (remAuthId === targetAuthId || remAuthId === targetId || remAuthId === targetEmpId)) return true;

  // 3. Match on email
  if (remEmail && targetEmail && remEmail === targetEmail) return true;
  if (remEmpId && targetEmail && remEmpId === targetEmail) return true;

  // 4. Fallback checking substring match or basic equality
  if (targetEmpId && remEmpId === targetEmpId) return true;
  if (targetId && remEmpId === targetId) return true;

  return false;
};
