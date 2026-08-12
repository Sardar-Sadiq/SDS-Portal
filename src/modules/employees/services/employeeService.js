import { supabase } from '@/lib/supabaseClient';
import { profileService } from '@/modules/profile/services/profileService';

export const employeeService = {
  // Fetch real employee list from SDS_Employees table with silent fallback
  async fetchEmployees() {
    try {
      let { data, error } = await supabase
        .from('SDS_Employees')
        .select('*');

      if (error) {
        // Try lowercase table name fallback 'sds_employees'
        const fallback = await supabase.from('sds_employees').select('*');
        if (!fallback.error && fallback.data) {
          data = fallback.data;
          error = null;
        }
      }

      if (error || !data || data.length === 0) {
        return [];
      }

      return data
        .map(emp => {
          const email = emp.email || emp.email_address || 'staff@spiritdatasolutions.com';
          const name = emp.full_name || emp.name || emp.employee_name || email;
          const empIdStr = emp.employee_id || emp.employeeId || emp.id || 'SDS-1001';
          const localCache = profileService.getLocalAvatar(email);

          const avatarStyle = emp.avatar_style || localCache?.avatarStyle || 'bottts';
          const avatarSeed = emp.avatar_seed || localCache?.avatarSeed || empIdStr;
          const diceBearUrl = profileService.getDiceBearUrl(avatarStyle, avatarSeed);
          
          const avatarUrl = (emp.avatar && !emp.avatar.includes('ui-avatars') && !emp.avatar.includes('unavatar.io'))
            ? emp.avatar
            : diceBearUrl;

          return {
            id: emp.id || emp.employee_id || `emp-${Math.random()}`,
            employeeId: empIdStr,
            auth_id: emp.auth_id || emp.authId || emp.id,
            name: name,
            email: email,
            avatarStyle: avatarStyle,
            avatarSeed: avatarSeed,
            avatar: avatarUrl,
            role: (emp.role || emp.system_role || 'EMPLOYEE').toUpperCase(),
            department: emp.department || emp.dept || 'Engineering',
            designation: emp.designation || emp.title || 'Staff',
            phone: emp.phone || emp.phone_number || '+91 98765 43210',
            joiningDate: emp.joining_date || emp.joiningDate || '2024-01-15',
            manager: emp.manager || 'Sardar Sadiq',
            isActive: emp.is_active !== false,
            leaveBalance: emp.leave_balance || emp.leaveBalance || { casual: 12, sick: 8, annual: 15 }
          };
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      return [];
    }
  },

  // Add new employee directly into Supabase SDS_Employees table
  async addEmployee(empData) {
    const email = empData.email?.trim().toLowerCase() || 'staff@spiritdatasolutions.com';
    const name = empData.name || empData.full_name || 'New Staff';
    const empId = empData.employeeId?.trim() || `${Math.floor(100000 + Math.random() * 900000)}_IN`;
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
    const avatarUrl = empData.avatar || `https://unavatar.io/${encodeURIComponent(email)}?fallback=${encodeURIComponent(fallbackAvatar)}`;

    const rowObj = {
      id: empId,
      email: email,
      full_name: name,
      role: 'employee', // Always default to employee for new staff added by admin
      department: empData.department || 'Developer',
      is_active: true,
      employee_id: empId,
      designation: empData.designation || 'Software Engineer',
      phone: empData.phone || '+91 98765 43210',
      joining_date: empData.joiningDate || new Date().toISOString().split('T')[0],
      manager: empData.manager || 'Sardar Sadiq',
      avatar: avatarUrl
    };

    try {
      const { data, error } = await supabase
        .from('SDS_Employees')
        .insert([rowObj])
        .select();

      if (error) {
        console.error('employeeService.addEmployee error:', error.message);
      }
      return data;
    } catch (err) {
      console.error('employeeService.addEmployee catch error:', err);
      return null;
    }
  },

  // Soft-delete employee by setting is_active = false in SDS_Employees table
  async deleteEmployee(empId) {
    if (!empId) return;
    try {
      await supabase
        .from('SDS_Employees')
        .update({ is_active: false })
        .or(`id.eq.${empId},employee_id.eq.${empId},email.eq.${empId}`);
    } catch (err) {
      try {
        await supabase
          .from('sds_employees')
          .update({ is_active: false })
          .or(`id.eq.${empId},employee_id.eq.${empId},email.eq.${empId}`);
      } catch (e) {}
    }
  },

  // Subscribe to real-time changes on SDS_Employees table
  subscribeToEmployeeChanges(onChange) {
    try {
      const channel = supabase
        .channel('realtime_employees_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'SDS_Employees' },
          (payload) => {
            onChange(payload);
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      return { unsubscribe: () => {} };
    }
  }
};
