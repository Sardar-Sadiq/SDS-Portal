import { supabase } from '@/lib/supabaseClient';

export const employeeService = {
  // Fetch real employee list from SDS_Employees table and map card_image from EmployeesDetails by ID comparison
  async fetchEmployees() {
    try {
      let { data, error } = await supabase
        .from('SDS_Employees')
        .select('*');

      if (error) {
        const fallback = await supabase.from('sds_employees').select('*');
        if (!fallback.error && fallback.data) {
          data = fallback.data;
          error = null;
        }
      }

      if (error || !data || data.length === 0) {
        return [];
      }

      // Query EmployeesDetails table to compare ID and map card_image
      let detailsMap = new Map();
      try {
        const { data: detailsData } = await supabase.from('EmployeesDetails').select('*');
        if (detailsData && detailsData.length > 0) {
          detailsData.forEach(d => {
            const empKey = d.Employee_ID ? String(d.Employee_ID).trim() : null;
            if (empKey && d.card_image) {
              detailsMap.set(empKey, d.card_image);
            }
          });
        }
      } catch (err) {
        console.warn('employeeService: could not fetch EmployeesDetails table', err);
      }

      return data
        .map(emp => {
          const email = emp.email || emp.email_address || 'staff@spiritdatasolutions.com';
          const name = emp.full_name || emp.name || emp.employee_name || email;
          const empIdStr = emp.id || emp.employee_id || emp.employeeId || 'SDS-1001';

          // Match ID with EmployeesDetails card_image
          const cardImageFromDetails = detailsMap.get(String(empIdStr).trim());
          const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
          
          const finalCardImage = cardImageFromDetails || (emp.avatar && !emp.avatar.includes('dicebear.com') ? emp.avatar : fallbackAvatar);

          return {
            id: empIdStr,
            employeeId: empIdStr,
            auth_id: emp.auth_id || emp.authId || emp.id,
            name: name,
            email: email,
            card_image: finalCardImage,
            avatar: finalCardImage,
            role: (emp.role || emp.system_role || 'EMPLOYEE').toUpperCase(),
            department: emp.department || emp.dept || 'Engineering',
            designation: emp.designation || emp.title || 'Staff',
            phone: emp.phone || emp.phone_number || emp.contact || emp.mobile || '',
            joiningDate: emp.joining_date || emp.joiningDate || emp.created_at?.split('T')[0] || '',
            manager: emp.manager || 'Sardar Sadiq',
            isActive: emp.is_active !== false,
            leaveBalance: emp.leave_balance || emp.leaveBalance || { casual: 12, sick: 8, annual: 15 }
          };
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.error('employeeService.fetchEmployees catch error:', err);
      return [];
    }
  },

  // Add new employee directly into Supabase SDS_Employees database table
  async addEmployee(empData) {
    const email = empData.email?.trim().toLowerCase() || 'staff@spiritdatasolutions.com';
    const name = empData.name || empData.full_name || 'New Staff';
    const empId = empData.employeeId?.trim() || `${Math.floor(100000 + Math.random() * 900000)}_IN`;
    const roleStr = (empData.role || 'employee').toLowerCase(); // lowercase required by role_check constraint in Postgres
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
    const cardImgUrl = empData.card_image || empData.avatar || fallbackAvatar;

    // Payload matching exact column schema of SDS_Employees table in Supabase Postgres
    const rowToInsert = {
      id: empId,
      email: email,
      full_name: name,
      role: roleStr,
      department: empData.department || 'IT',
      designation: empData.designation || 'Software Engineer',
      phone: empData.phone || '',
      joining_date: empData.joiningDate || empData.joining_date || new Date().toISOString().split('T')[0],
      is_active: true
    };

    try {
      const res = await supabase.from('SDS_Employees').insert([rowToInsert]).select();
      
      if (res.error) {
        console.error('employeeService: insert error on SDS_Employees:', res.error.message);
        return null;
      }

      if (res.data && res.data.length > 0) {
        const createdRow = res.data[0];
        return [{
          ...createdRow,
          employee_id: createdRow.id,
          name: createdRow.full_name,
          role: (createdRow.role || 'EMPLOYEE').toUpperCase(),
          card_image: cardImgUrl,
          avatar: cardImgUrl
        }];
      }
    } catch (err) {
      console.error('employeeService.addEmployee catch error:', err);
    }
    return null;
  },

  // Soft-delete employee by setting is_active = false in SDS_Employees table
  async deleteEmployee(empId) {
    if (!empId) return;
    try {
      await supabase
        .from('SDS_Employees')
        .update({ is_active: false })
        .or(`id.eq.${empId},email.eq.${empId}`);
    } catch (err) {
      try {
        await supabase
          .from('sds_employees')
          .update({ is_active: false })
          .or(`id.eq.${empId},email.eq.${empId}`);
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

