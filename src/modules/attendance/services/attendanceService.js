import { supabase } from '@/lib/supabaseClient';

export const attendanceService = {
  // Fetch attendance records (90 days window)
  async fetchAttendance({ employeeId, isAdmin }) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const fromDate = ninetyDaysAgo.toISOString().split('T')[0];

    let query = supabase
      .from('SDS_Attendance')
      .select('*')
      .gte('date', fromDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!isAdmin && employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      avatar: row.avatar ?? '',
      department: row.department ?? '',
      date: row.date,
      checkIn: row.check_in ?? null,
      checkOut: row.check_out ?? null,
      workingHours: row.working_hours ?? 0,
      status: row.status,
      locationVerified: row.location_verified,
      coordinates: {
        lat: row.latitude ? Number(row.latitude) : null,
        lng: row.longitude ? Number(row.longitude) : null,
      },
      distanceFromOfficeMeters: row.distance_from_office_meters ?? null,
      accuracyMeters: row.accuracy_meters ?? null,
      officeName: row.office_name ?? null,
      isLate: row.is_late,
    }));
  },

  // Record Check In
  async recordCheckIn(payload) {
    const { data, error } = await supabase
      .from('SDS_Attendance')
      .upsert(
        {
          employee_id: payload.employeeId,
          employee_name: payload.employeeName,
          avatar: payload.avatar ?? null,
          department: payload.department ?? null,
          date: payload.date,
          check_in: payload.checkIn,
          check_out: null,
          working_hours: 0.1,
          status: payload.status,
          is_late: payload.isLate,
          location_verified: true,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          distance_from_office_meters: payload.distanceMeters ?? null,
          accuracy_meters: payload.accuracyMeters ?? null,
          office_name: payload.officeName ?? null,
        },
        { onConflict: 'employee_id,date' }
      )
      .select();

    if (error) throw error;
    return data;
  },

  // Record Check Out
  async recordCheckOut({ employeeId, date, checkOutTime, workingHours }) {
    const { data, error } = await supabase
      .from('SDS_Attendance')
      .update({
        check_out: checkOutTime,
        working_hours: workingHours,
      })
      .eq('employee_id', employeeId)
      .eq('date', date)
      .select();

    if (error) throw error;
    return data;
  },

  // Subscribe to real-time changes on SDS_Attendance table
  subscribeToAttendanceChanges(onChange) {
    const channel = supabase
      .channel('realtime_attendance_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'SDS_Attendance' },
        (payload) => {
          onChange(payload);
        }
      )
      .subscribe();

    return channel;
  }
};
