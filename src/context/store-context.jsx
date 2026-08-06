'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE, INITIAL_LEAVES, INITIAL_REMARKS, INITIAL_OFFICE_SETTINGS } from '@/lib/mock-data';
import { useAnimatedToastStack } from '@/components/motion/animated-toast-stack';
import { supabase } from '@/lib/supabaseClient';

const StoreContext = createContext(undefined);

export const StoreProvider = ({ children }) => {
  const { toasts, showToast, dismissToast, clearToasts } = useAnimatedToastStack();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVES);
  const [remarks, setRemarks] = useState(INITIAL_REMARKS);
  const [officeSettings, setOfficeSettings] = useState(INITIAL_OFFICE_SETTINGS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("emp-002");
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Elena Rostova • Leave Request",
      message: "Applied for 2 days of Casual Leave. Awaiting admin review.",
      time: "10 mins ago",
      read: false,
      type: "INFO",
      targetRole: "ADMIN"
    },
    {
      id: "notif-2",
      title: "Attendance SLA Target",
      message: "4 out of 5 staff checked in on-time before 09:00 AM.",
      time: "1 hour ago",
      read: true,
      type: "SUCCESS",
      targetRole: "ADMIN"
    },
    {
      id: "notif-3",
      title: "GPS Geo-Fence System Active",
      message: "HQ geofence radius locked within 500m.",
      time: "Today",
      read: true,
      type: "INFO",
      targetRole: "ADMIN"
    },
    {
      id: "notif-4",
      title: "GPS Geo-Fence Verified",
      message: "Location verified within 50m of office campus.",
      time: "Today",
      read: false,
      type: "SUCCESS",
      targetRole: "EMPLOYEE"
    },
    {
      id: "notif-5",
      title: "Leave Status Pending",
      message: "Your Casual leave application is currently under admin review.",
      time: "2 hours ago",
      read: false,
      type: "INFO",
      targetRole: "EMPLOYEE"
    },
    {
      id: "notif-6",
      title: "Monthly Attendance Record",
      message: "21 working days recorded with 98% SLA compliance.",
      time: "Yesterday",
      read: true,
      type: "SUCCESS",
      targetRole: "EMPLOYEE"
    }
  ]);

  // Sync session with Supabase Auth on mount & on auth changes
  useEffect(() => {
    let isMounted = true;

    const syncSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userEmail = session.user.email?.trim().toLowerCase();

          // Try querying `SDS_Employees` first, then fallback to `employees`
          let tableName = 'SDS_Employees';
          let employee = null;

          const { data: sdsData } = await supabase
            .from('SDS_Employees')
            .select('*');

          if (sdsData && sdsData.length > 0) {
            employee = sdsData.find(emp => emp.is_active !== false && emp.email?.trim().toLowerCase() === userEmail);
          }

          if (employee && isMounted) {
            // Update auth_id on first login if NULL
            if (!employee.auth_id) {
              await supabase
                .from(tableName)
                .update({ auth_id: session.user.id })
                .ilike('email', userEmail);
              employee.auth_id = session.user.id;
            }

            const roleUpper = (employee.role || 'EMPLOYEE').toUpperCase();
            const defaultLeaveBalance = { casual: 12, sick: 8, annual: 15 };
            const defaultOfficeLocation = { lat: 28.6139, lng: 77.2090, radiusMeters: 500 };

            const userObj = {
              id: employee.id || session.user.id,
              employeeId: employee.id || session.user.id,
              auth_id: session.user.id,
              email: employee.email,
              name: employee.full_name || session.user.email,
              full_name: employee.full_name || session.user.email,
              role: roleUpper,
              department: employee.department || 'Developer',
              designation: employee.designation || (roleUpper === 'ADMIN' ? 'Manager' : 'Software Engineer'),
              phone: employee.phone || '+91 98765 43210',
              manager: employee.manager || 'Sardar Sadiq',
              joiningDate: employee.joiningDate || '2024-01-15',
              avatar: employee.avatar || '',
              officeLocation: employee.officeLocation || defaultOfficeLocation,
              leaveBalance: employee.leaveBalance || defaultLeaveBalance
            };
            setCurrentUser(userObj);
            setActiveRole(roleUpper);
          } else if (isMounted) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setActiveRole(null);
          }
        } else if (isMounted) {
          setCurrentUser(null);
          setActiveRole(null);
        }
      } catch (err) {
        console.error('StoreProvider: Supabase session sync error', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    syncSupabaseSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setCurrentUser(null);
          setActiveRole(null);
          setAuthLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ── Attendance: fetch from Supabase when currentUser is known ───────────────
  // Runs whenever currentUser changes (login → sets records; logout → clears them).
  // Optimistic strategy: local state is the source of truth for immediate UI
  // responsiveness. Supabase is the source of truth for persistence.
  useEffect(() => {
    if (!currentUser?.employeeId) return;

    let isMounted = true;
    const isAdmin = (currentUser.role || '').toUpperCase() === 'ADMIN';

    const fetchAttendance = async () => {
      try {
        // Admins see all records for the last 90 days; employees see only their own.
        // Limiting to 90 days prevents an unbounded scan as the table grows.
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const fromDate = ninetyDaysAgo.toISOString().split('T')[0];

        let query = supabase
          .from('SDS_Attendance')
          .select('*')
          .gte('date', fromDate)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        // Employees only see their own records
        if (!isAdmin) {
          query = query.eq('employee_id', currentUser.employeeId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('StoreProvider: Failed to fetch SDS_Attendance —', error.message);
          // Keep the existing mock data as a fallback — don't wipe the UI
          return;
        }

        if (!isMounted || !data) return;

        // Map DB snake_case columns back to the camelCase shape the UI expects
        const mapped = data.map((row) => ({
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

        setAttendanceRecords(mapped);
      } catch (err) {
        console.error('StoreProvider: Unexpected error fetching attendance —', err);
      }
    };

    fetchAttendance();

    return () => { isMounted = false; };
  }, [currentUser?.employeeId]);

  const setAuthenticatedUser = (payload) => {
    if (!payload) {
      setCurrentUser(null);
      setActiveRole(null);
      setAuthLoading(false);
      return;
    }
    const roleUpper = (payload.role || 'EMPLOYEE').toUpperCase();
    const defaultLeaveBalance = { casual: 12, sick: 8, annual: 15 };
    const defaultOfficeLocation = { lat: 28.6139, lng: 77.2090, radiusMeters: 500 };

    const userObj = {
      id: payload.id,
      employeeId: payload.id,
      auth_id: payload.auth_id || payload.id,
      email: payload.email,
      name: payload.full_name || payload.email,
      full_name: payload.full_name || payload.email,
      role: roleUpper,
      department: payload.department || 'Developer',
      designation: payload.designation || (roleUpper === 'ADMIN' ? 'Manager' : 'Software Engineer'),
      phone: payload.phone || '+91 98765 43210',
      manager: payload.manager || 'Sardar Sadiq',
      joiningDate: payload.joiningDate || '2024-01-15',
      avatar: payload.avatar || '',
      officeLocation: payload.officeLocation || defaultOfficeLocation,
      leaveBalance: payload.leaveBalance || defaultLeaveBalance
    };
    setCurrentUser(userObj);
    setActiveRole(roleUpper);
    setAuthLoading(false);
  };

  const clearAuth = () => {
    setCurrentUser(null);
    setActiveRole(null);
    setAuthLoading(false);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('StoreProvider: logout error', err);
    }
    setCurrentUser(null);
    setActiveRole(null);
    setAuthLoading(false);
  };

  const checkIn = (coords) => {
    if (!currentUser) return { success: false, message: "Not logged in" };

    const todayStr = new Date().toISOString().split('T')[0];
    const existing = attendanceRecords.find(a => a.employeeId === currentUser.employeeId && a.date === todayStr);

    if (existing && existing.checkIn) {
      return { success: false, message: `You have already checked in today at ${existing.checkIn}.` };
    }

    const userLat = coords?.lat ?? null;
    const userLng = coords?.lng ?? null;

    // If the modal (GeoCheckInModal) already verified the user's location against
    // the DB-backed office_locations table, trust that result directly.
    // coords.distanceFromOfficeMeters is set by resolveNearestOffice() in geofence.js.
    // Re-computing against officeSettings.geoFence here would compare against the
    // local mock coordinates (which differ from the real office) and silently reject
    // every legitimate check-in.
    const distanceMeters = coords?.distanceFromOfficeMeters ?? 0;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const [startH, startM] = officeSettings.officeStartTime.split(':').map(Number);
    const startTimeInMins = startH * 60 + startM + officeSettings.gracePeriodMinutes;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const isLate = currentMins > startTimeInMins;
    const status = isLate ? 'LATE' : 'PRESENT';

    const newRecord = {
      id: `att-${Date.now()}`,
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name,
      avatar: currentUser.avatar,
      department: currentUser.department,
      date: todayStr,
      checkIn: timeStr,
      checkOut: null,
      workingHours: 0.1,
      status: status,
      locationVerified: true,
      coordinates: { lat: userLat, lng: userLng },
      distanceFromOfficeMeters: distanceMeters,
      // Audit fields — preserved on the record so Admin can review disputed check-ins.
      // accuracyMeters: how precise the GPS fix was (higher = less precise).
      // officeName: which branch the check-in was resolved against (multi-branch support).
      accuracyMeters: coords?.accuracyMeters ?? null,
      officeName: coords?.officeName ?? null,
      isLate
    };

    // 1. Optimistic local update — UI reflects the check-in immediately
    setAttendanceRecords(prev => [newRecord, ...prev.filter(r => !(r.employeeId === currentUser.employeeId && r.date === todayStr))]);

    // 2. Persist to Supabase — map JS camelCase → DB snake_case.
    //    Using upsert with the (employee_id, date) conflict key so re-opens of
    //    the modal don't create duplicate rows if the user refreshes mid-flow.
    supabase
      .from('SDS_Attendance')
      .upsert(
        {
          employee_id: currentUser.employeeId,
          employee_name: currentUser.name,
          avatar: currentUser.avatar ?? null,
          department: currentUser.department ?? null,
          date: todayStr,
          check_in: timeStr,
          check_out: null,
          working_hours: 0,
          status: status,
          is_late: isLate,
          location_verified: true,
          latitude: userLat ?? null,
          longitude: userLng ?? null,
          distance_from_office_meters: distanceMeters ?? null,
          accuracy_meters: coords?.accuracyMeters ?? null,
          office_name: coords?.officeName ?? null,
        },
        { onConflict: 'employee_id,date' }
      )
      .then(({ error }) => {
        if (error) {
          // Log but don't throw — local state is already updated. The user
          // sees a successful check-in in the UI; the admin should investigate
          // the Supabase error separately.
          console.error('StoreProvider: Failed to persist check-in to Supabase —', error.message);
        }
      });

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}-emp`,
        title: status === 'LATE' ? "Check-In Recorded (Late)" : "GPS Check-In Verified",
        message: `Checked in at ${timeStr}. Location verified (${distanceMeters}m from office).`,
        time: "Just now",
        read: false,
        type: status === 'LATE' ? "INFO" : "SUCCESS",
        targetUser: currentUser.employeeId
      },
      {
        id: `notif-${Date.now()}-admin`,
        title: `${currentUser.name} Checked In`,
        message: `${currentUser.name} (${currentUser.department}) checked in at ${timeStr} [${status}].`,
        time: "Just now",
        read: false,
        type: status === 'LATE' ? "INFO" : "SUCCESS",
        targetRole: "ADMIN"
      },
      ...prev
    ]);

    showToast({
      title: status === 'LATE' ? "Checked In (Late)" : "GPS Check-In Verified",
      description: `Successfully checked in at ${timeStr}. Distance from office: ${distanceMeters}m.`,
      status: status === 'LATE' ? "info" : "success"
    });

    return {
      success: true,
      message: `Successfully checked in at ${timeStr}. Status: ${status} (${distanceMeters}m from office).`
    };
  };

  const checkOut = () => {
    if (!currentUser) return { success: false, message: "Not logged in" };

    const todayStr = new Date().toISOString().split('T')[0];
    const existingIndex = attendanceRecords.findIndex(a => a.employeeId === currentUser.employeeId && a.date === todayStr);

    if (existingIndex === -1 || !attendanceRecords[existingIndex].checkIn) {
      return { success: false, message: "You need to check in first before checking out." };
    }

    if (attendanceRecords[existingIndex].checkOut) {
      return { success: false, message: "You have already checked out for today." };
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const checkInTime = attendanceRecords[existingIndex].checkIn;
    const [inH, inM] = checkInTime.split(':').map(Number);
    const checkInMinutes = inH * 60 + inM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const hoursWorked = Math.max(0.5, Number(((currentMinutes - checkInMinutes) / 60).toFixed(2)));

    const updated = [...attendanceRecords];
    updated[existingIndex] = {
      ...updated[existingIndex],
      checkOut: timeStr,
      workingHours: hoursWorked
    };

    // 1. Optimistic local update
    setAttendanceRecords(updated);

    // 2. Persist check-out to Supabase — UPDATE the existing row for today.
    //    We update by (employee_id, date) rather than by uuid so we don't need
    //    to thread the DB-generated id back through the local record.
    supabase
      .from('SDS_Attendance')
      .update({
        check_out: timeStr,
        working_hours: hoursWorked,
      })
      .eq('employee_id', currentUser.employeeId)
      .eq('date', todayStr)
      .then(({ error }) => {
        if (error) {
          console.error('StoreProvider: Failed to persist check-out to Supabase —', error.message);
        }
      });

    return {
      success: true,
      message: `Checked out at ${timeStr}. Total recorded working hours: ${hoursWorked} hrs.`
    };
  };

  const applyLeave = (leaveData) => {
    if (!currentUser) return;

    const newLeave = {
      id: `leave-${Date.now()}`,
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name,
      avatar: currentUser.avatar,
      department: currentUser.department,
      leaveType: leaveData.leaveType,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      totalDays: leaveData.totalDays,
      reason: leaveData.reason,
      status: 'PENDING',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests(prev => [newLeave, ...prev]);
    showToast({
      title: "Leave Request Submitted",
      description: `Submitted ${leaveData.leaveType} leave application for ${leaveData.totalDays} day(s).`,
      status: "success"
    });
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}-admin`,
        title: `${currentUser.name} • Leave Requested`,
        message: `Submitted ${leaveData.leaveType} leave for ${leaveData.totalDays} day(s).`,
        time: "Just now",
        read: false,
        type: "INFO",
        targetRole: "ADMIN"
      },
      {
        id: `notif-${Date.now()}-emp`,
        title: "Leave Application Submitted",
        message: `Your ${leaveData.leaveType} leave application was submitted for admin review.`,
        time: "Just now",
        read: false,
        type: "INFO",
        targetUser: currentUser.employeeId
      },
      ...prev
    ]);
  };

  const reviewLeave = (leaveId, status, adminNote) => {
    if (activeRole !== 'ADMIN') return;

    const targetReq = leaveRequests.find(r => r.id === leaveId);

    setLeaveRequests(prev => prev.map(req => {
      if (req.id === leaveId) {
        return {
          ...req,
          status,
          reviewedBy: currentUser?.name || 'Admin',
          reviewedOn: new Date().toISOString().split('T')[0],
          adminNote
        };
      }
      return req;
    }));

    if (targetReq) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: `Leave Application ${status}`,
          message: `Your leave request for ${targetReq.startDate} to ${targetReq.endDate} was ${status.toLowerCase()} by Admin.`,
          time: "Just now",
          read: false,
          type: status === 'APPROVED' ? "SUCCESS" : "ERROR",
          targetUser: targetReq.employeeId
        },
        ...prev
      ]);
      showToast({
        title: `Leave Request ${status}`,
        description: `Leave request for ${targetReq.employeeName} has been ${status.toLowerCase()}.`,
        status: status === 'APPROVED' ? "success" : "info"
      });
    }
  };

  const addEmployee = (employeeData) => {
    if (activeRole !== 'ADMIN') return;
    const newEmp = {
      ...employeeData,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [...prev, newEmp]);
  };

  const addRemark = (employeeId, content, category) => {
    if (activeRole !== 'ADMIN') return;
    const newRemark = {
      id: `rem-${Date.now()}`,
      employeeId,
      authorId: currentUser?.employeeId || 'SDS-1001',
      authorName: currentUser?.name || 'Sardar Sadiq',
      authorRole: activeRole,
      content,
      category,
      createdAt: new Date().toISOString()
    };
    setRemarks(prev => [newRemark, ...prev]);
  };

  const editRemark = (remarkId, content, category) => {
    if (activeRole !== 'ADMIN') return;
    setRemarks(prev => prev.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          content,
          category
        };
      }
      return r;
    }));
  };

  const addHoliday = (holidayData) => {
    if (activeRole !== 'ADMIN') return;
    const newHoliday = {
      id: `hol-${Date.now()}`,
      ...holidayData
    };
    setOfficeSettings(prev => ({
      ...prev,
      holidayCalendar: [...prev.holidayCalendar, newHoliday]
    }));
  };

  const editHoliday = (idOrIndex, updatedData) => {
    if (activeRole !== 'ADMIN') return;
    setOfficeSettings(prev => {
      const updatedList = prev.holidayCalendar.map((item, idx) => {
        if (item.id === idOrIndex || idx === idOrIndex) {
          return { ...item, ...updatedData };
        }
        return item;
      });
      return { ...prev, holidayCalendar: updatedList };
    });
  };

  const deleteHoliday = (idOrIndex) => {
    if (activeRole !== 'ADMIN') return;
    setOfficeSettings(prev => ({
      ...prev,
      holidayCalendar: prev.holidayCalendar.filter((item, idx) => item.id !== idOrIndex && idx !== idOrIndex)
    }));
  };

  const updateSettings = (newSettings) => {
    if (activeRole !== 'ADMIN') return;
    setOfficeSettings(prev => ({ ...prev, ...newSettings }));
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Export Attendance & Leave Ledger to Excel CSV format
  const exportAttendanceExcel = () => {
    // Generate combined report rows
    const rows = [];

    // Header row
    rows.push([
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Date",
      "Check In",
      "Check Out",
      "Hours Worked",
      "Attendance Status",
      "Location Verified",
      "Distance (Meters)",
      "On Leave Status",
      "Leave Type",
      "Leave Dates",
      "Leave Reason"
    ]);

    const targetAttendance = activeRole === 'ADMIN'
      ? attendanceRecords
      : attendanceRecords.filter(a => a.employeeId === currentUser?.employeeId);

    const targetLeaves = activeRole === 'ADMIN'
      ? leaveRequests
      : leaveRequests.filter(l => l.employeeId === currentUser?.employeeId);

    // 1. Compile attendance records
    targetAttendance.forEach(rec => {
      const emp = employees.find(e => e.employeeId === rec.employeeId);
      // Check matching leave for that date
      const matchingLeave = targetLeaves.find(l => 
        l.employeeId === rec.employeeId && 
        l.status === 'APPROVED' &&
        rec.date >= l.startDate && 
        rec.date <= l.endDate
      );

      rows.push([
        `"${rec.employeeId}"`,
        `"${rec.employeeName}"`,
        `"${rec.department}"`,
        `"${emp?.designation || 'Staff'}"`,
        `"${rec.date}"`,
        `"${rec.checkIn || '--'}"`,
        `"${rec.checkOut || '--'}"`,
        `"${rec.workingHours || 0}"`,
        `"${rec.status}"`,
        `"${rec.locationVerified ? 'YES' : 'NO'}"`,
        `"${rec.distanceFromOfficeMeters ?? '--'}"`,
        `"${matchingLeave ? 'YES (APPROVED LEAVE)' : 'NO'}"`,
        `"${matchingLeave?.leaveType || '--'}"`,
        `"${matchingLeave ? `${matchingLeave.startDate} to ${matchingLeave.endDate}` : '--'}"`,
        `"${matchingLeave?.reason ? matchingLeave.reason.replace(/"/g, '""') : '--'}"`
      ]);
    });

    // 2. Also add employees who took leaves on dates not in attendance table
    targetLeaves.filter(l => l.status === 'APPROVED').forEach(leave => {
      const emp = employees.find(e => e.employeeId === leave.employeeId);
      const existsInAtt = targetAttendance.some(a => a.employeeId === leave.employeeId && a.date >= leave.startDate && a.date <= leave.endDate);
      
      if (!existsInAtt) {
        rows.push([
          `"${leave.employeeId}"`,
          `"${leave.employeeName}"`,
          `"${leave.department}"`,
          `"${emp?.designation || 'Staff'}"`,
          `"${leave.startDate}"`,
          `"--"`,
          `"--"`,
          `"0"`,
          `"ON_LEAVE"`,
          `"NO"`,
          `"--"`,
          `"YES (APPROVED LEAVE)"`,
          `"${leave.leaveType}"`,
          `"${leave.startDate} to ${leave.endDate}"`,
          `"${leave.reason ? leave.reason.replace(/"/g, '""') : '--'}"`
        ]);
      }
    });

    // Create UTF-8 BOM CSV content for Microsoft Excel compatibility
    const csvContent = "\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const todayStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `SDS_EMS_Attendance_Leave_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      title: "Excel Ledger Exported",
      description: "SDS EMS attendance & leave report downloaded successfully as CSV.",
      status: "success"
    });
  };

  const roleNotifications = notifications.filter(n => {
    if (n.targetUser) {
      return n.targetUser === currentUser?.employeeId;
    }
    if (n.targetRole) {
      return n.targetRole === activeRole;
    }
    return true;
  });

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        activeRole,
        authLoading,
        setAuthenticatedUser,
        clearAuth,
        employees,
        attendanceRecords,
        leaveRequests,
        remarks,
        officeSettings,
        notifications: roleNotifications,
        selectedEmployeeId,
        toasts,
        showToast,
        dismissToast,
        loginWithGoogle,
        logout,
        setSelectedEmployeeId,
        checkIn,
        checkOut,
        applyLeave,
        reviewLeave,
        addEmployee,
        addRemark,
        editRemark,
        addHoliday,
        editHoliday,
        deleteHoliday,
        updateSettings,
        markNotificationAsRead,
        dismissNotification,
        exportAttendanceExcel
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
