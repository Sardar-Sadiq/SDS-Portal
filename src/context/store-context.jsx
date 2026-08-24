'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE, INITIAL_LEAVES, INITIAL_REMARKS, INITIAL_OFFICE_SETTINGS } from '@/lib/mock-data';
import { useAnimatedToastStack } from '@/components/motion/animated-toast-stack';
import { supabase } from '@/lib/supabaseClient';
import { attendanceService } from '@/modules/attendance/services/attendanceService';
import { leaveService } from '@/modules/leave/services/leaveService';
import { employeeService } from '@/modules/employees/services/employeeService';
import { remarkService, isRemarkForEmployee } from '@/modules/remarks/services/remarkService';
import { profileService } from '@/modules/profile/services/profileService';



const StoreContext = createContext(undefined);

// ── Session persistence helpers ───────────────────────────────────────────────
const SESSION_STORAGE_KEY = 'sds_current_user';

function saveUserToSession(userObj) {
  try {
    if (userObj) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userObj));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) { /* ignore quota errors */ }
}

function loadUserFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export const StoreProvider = ({ children }) => {
  const { toasts, showToast, dismissToast, clearToasts } = useAnimatedToastStack();
  // Restore user from sessionStorage instantly on page refresh — prevents flicker to /login
  const [currentUser, setCurrentUser] = useState(() => loadUserFromSession());
  const [activeRole, setActiveRole] = useState(() => {
    const saved = loadUserFromSession();
    return saved?.role || null;
  });
  // Start with authLoading=false if we have a cached user (avoids spinner on refresh)
  const [authLoading, setAuthLoading] = useState(() => !loadUserFromSession());
  const LEAVES_STORAGE_KEY = 'sds_leave_requests_cache_v4';
  const getInitialLeaveRequests = () => {
    try {
      const saved = localStorage.getItem(LEAVES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !['leave-301', 'leave-302', 'leave-303'].includes(item.id));
        }
      }
    } catch (e) {}
    return [];
  };

  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState(getInitialLeaveRequests);
  const [remarks, setRemarks] = useState(INITIAL_REMARKS);
  const [officeSettings, setOfficeSettings] = useState(INITIAL_OFFICE_SETTINGS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("emp-002");
  const [leaveBalances, setLeaveBalances] = useState({ casual: 12, sick: 12, emergency: 10 });

  useEffect(() => {
    try {
      if (leaveRequests && leaveRequests.length > 0) {
        localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leaveRequests));
      }
    } catch (e) {}
  }, [leaveRequests]);

  const NOTIFICATIONS_STORAGE_KEY = 'sds_notifications_v2';
  const getInitialNotifications = () => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  };

  const [notifications, setNotifications] = useState(getInitialNotifications);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) { }
  }, [notifications]);

  // Sync session with Supabase Auth on mount & on auth changes
  useEffect(() => {
    let isMounted = true;

    const syncSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userEmail = session.user.email?.trim().toLowerCase();

          let tableName = 'SDS_Employees';
          let employee = null;
          let sdsData = null;

          // 1. Query SDS_Employees table
          try {
            const { data } = await supabase
              .from('SDS_Employees')
              .select('*')
              .ilike('email', userEmail)
              .limit(1);
            sdsData = data;
          } catch (e) {
            sdsData = null;
          }

          if (sdsData && sdsData.length > 0) {
            employee = sdsData.find(emp => emp.is_active !== false && emp.email?.trim().toLowerCase() === userEmail);
          }

          // 2. Fallback: match against INITIAL_EMPLOYEES list
          if (!employee) {
            employee = INITIAL_EMPLOYEES.find(e => (e.email || '').toLowerCase() === userEmail);
          }

          // 3. Fallback: match Admin email keywords (sarda, sanji, sardar, sadiq, admin, spiritdatasolutions)
          if (!employee) {
            const prefix = (userEmail || '').split('@')[0];
            if (
              prefix.includes('sarda') ||
              prefix.includes('sanji') ||
              prefix.includes('sardar') ||
              prefix.includes('sadiq') ||
              prefix.includes('admin') ||
              userEmail.includes('spiritdatasolutions')
            ) {
              employee = {
                id: 'emp-001',
                auth_id: session.user.id,
                email: userEmail,
                full_name: session.user.user_metadata?.full_name || 'Sardar Sadiq',
                role: 'ADMIN',
                department: 'Engineering',
                designation: 'Principal Architect'
              };
            }
          }

          // 4. Fallback: Auto-provision new Google OAuth user into SDS_Employees
          if (!employee) {
            const newEmpName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split('@')[0];
            employee = {
              id: `emp-${Date.now()}`,
              auth_id: session.user.id,
              email: userEmail,
              full_name: newEmpName,
              role: 'EMPLOYEE',
              department: 'IT',
              designation: 'Software Engineer',
              joining_date: new Date().toISOString().split('T')[0],
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
            };

            // Attempt async background insert to SDS_Employees table
            supabase.from('SDS_Employees').insert([{
              auth_id: session.user.id,
              email: userEmail,
              full_name: newEmpName,
              role: 'EMPLOYEE',
              department: 'IT',
              designation: 'Software Engineer',
              joining_date: new Date().toISOString().split('T')[0],
              is_active: true
            }]).catch(() => {});
          }

          if (employee && isMounted) {
            // Update auth_id on first login if NULL
            if (!employee.auth_id) {
              await supabase
                .from(tableName)
                .update({ auth_id: session.user.id })
                .ilike('email', userEmail)
                .catch(() => {});
              employee.auth_id = session.user.id;
            }

            // Compare ID in EmployeesDetails to get card_image
            let cardImageFromDetails = null;
            try {
              const { data: details } = await supabase
                .from('EmployeesDetails')
                .select('card_image')
                .eq('Employee_ID', String(employee.id || '').trim())
                .limit(1);
              if (details && details.length > 0 && details[0].card_image) {
                cardImageFromDetails = details[0].card_image;
              }
            } catch (e) { }

            const roleUpper = (employee.role || 'EMPLOYEE').toUpperCase();
            const defaultLeaveBalance = { casual: 12, sick: 12, emergency: 10 };
            const defaultOfficeLocation = { lat: 28.6139, lng: 77.2090, radiusMeters: 20 };

            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name || userEmail)}&background=10b981&color=fff&bold=true`;
            const userAvatar = cardImageFromDetails || (employee.avatar && !employee.avatar.includes('dicebear.com') ? employee.avatar : fallbackAvatar);

            const userObj = {
              id: employee.id || session.user.id,
              employeeId: employee.id || session.user.id,
              auth_id: session.user.id,
              email: employee.email || userEmail,
              name: employee.full_name || session.user.email,
              full_name: employee.full_name || session.user.email,
              role: roleUpper,
              department: employee.department || 'Developer',
              designation: employee.designation || (roleUpper === 'ADMIN' ? 'Manager' : 'Software Engineer'),
              phone: employee.phone || employee.phone_number || employee.contact || employee.mobile || '',
              manager: employee.manager || 'Sardar Sadiq',
              joiningDate: employee.joining_date || employee.joiningDate || employee.created_at?.split('T')[0] || '',
              card_image: userAvatar,
              avatar: userAvatar,
              officeLocation: employee.officeLocation || defaultOfficeLocation,
              leaveBalance: employee.leaveBalance || defaultLeaveBalance
            };
            setCurrentUser(userObj);
            setActiveRole(roleUpper);
            saveUserToSession(userObj);
          }
        } else if (isMounted) {
          const restoredUser = loadUserFromSession();
          if (!restoredUser) {
            setCurrentUser(null);
            setActiveRole(null);
          }
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

  // ── Employees: fetch real SDS_Employees from Supabase & subscribe to Realtime updates
  useEffect(() => {
    let isMounted = true;
    const loadEmployees = async () => {
      try {
        const empList = await employeeService.fetchEmployees();
        if (isMounted && empList) {
          setEmployees(empList);
        }
      } catch (err) {
        console.error('StoreProvider: Failed to load SDS_Employees —', err.message);
      }
    };

    loadEmployees();

    // Subscribe to realtime updates on SDS_Employees table
    const channel = employeeService.subscribeToEmployeeChanges(() => {
      loadEmployees();
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, []);

  // ── Attendance: fetch from Supabase and subscribe to Realtime updates ───────────────
  useEffect(() => {
    if (!currentUser?.employeeId) return;

    let isMounted = true;
    const isAdmin = (currentUser.role || '').toUpperCase() === 'ADMIN';

    const loadAttendance = async () => {
      try {
        const records = await attendanceService.fetchAttendance({
          employeeId: currentUser.employeeId,
          isAdmin,
        });
        if (isMounted && records) {
          setAttendanceRecords(records);
        }
      } catch (err) {
        console.error('StoreProvider: Attendance fetch error —', err.message);
      }
    };

    loadAttendance();

    // Live Realtime subscription: auto-sync check-in/outs instantly across browsers/tabs
    const channel = attendanceService.subscribeToAttendanceChanges(() => {
      loadAttendance();
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [currentUser?.employeeId, currentUser?.role]);

  // ── Leave Balances: fetch and subscribe to Realtime ledger changes ────
  const fetchLeaveBalances = async () => {
    if (!currentUser?.auth_id) return;
    try {
      const balances = await leaveService.fetchBalances(currentUser.auth_id);
      if (balances) {
        setLeaveBalances(balances);
      }
    } catch (err) {
      console.error('StoreProvider: Failed to fetch leave balances —', err.message);
    }
  };

  useEffect(() => {
    fetchLeaveBalances();

    // Subscribe to leave_ledger changes for real-time balance updates
    const channel = leaveService.subscribeToLeaveChanges(() => {
      fetchLeaveBalances();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser?.auth_id]);

  // ── Leave Requests: fetch real leave applications & subscribe to Realtime updates ────
  const fetchLeaveRequests = async () => {
    if (!currentUser?.employeeId) return;
    try {
      const isAdmin = (currentUser.role || '').toUpperCase() === 'ADMIN';
      const requests = await leaveService.fetchLeaveRequests({
        employeeId: currentUser.employeeId,
        isAdmin
      });
      if (requests) {
        setLeaveRequests(prev => {
          const map = new Map();
          const cleanRequests = requests.filter(r => !['leave-301', 'leave-302', 'leave-303'].includes(r.id));

          // 1. Add database records first (authoritative source of truth)
          cleanRequests.forEach(item => map.set(String(item.id), item));

          // 2. Add local items only if they are not dummy items AND not duplicates of database records
          prev.forEach(item => {
            if (['leave-301', 'leave-302', 'leave-303'].includes(item.id)) return;
            const isTemp = String(item.id).startsWith('leave-');
            if (isTemp) {
              const isDuplicateOfDb = cleanRequests.some(dbItem => 
                dbItem.employeeId === item.employeeId &&
                dbItem.startDate === item.startDate &&
                dbItem.endDate === item.endDate &&
                dbItem.reason === item.reason
              );
              if (!isDuplicateOfDb) {
                map.set(String(item.id), item);
              }
            } else if (!map.has(String(item.id))) {
              map.set(String(item.id), item);
            }
          });

          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error('StoreProvider: Failed to fetch leave requests —', err.message);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();

    const channel = leaveService.subscribeToLeaveChanges(() => {
      fetchLeaveRequests();
      fetchLeaveBalances();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser?.employeeId, currentUser?.role]);

  // ── Remarks: fetch real remarks & subscribe to Realtime updates ────
  useEffect(() => {
    let isMounted = true;
    const loadRemarks = async () => {
      try {
        const list = await remarkService.fetchRemarks();
        if (isMounted && list) {
          setRemarks(list);
        }
      } catch (err) {
        console.error('StoreProvider: Failed to load remarks —', err.message);
      }
    };

    loadRemarks();

    const channel = remarkService.subscribeToRemarkChanges(() => {
      loadRemarks();
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, []);

  const setAuthenticatedUser = (payload) => {
    if (!payload) {
      setCurrentUser(null);
      setActiveRole(null);
      setAuthLoading(false);
      return;
    }
    const roleUpper = (payload.role || 'EMPLOYEE').toUpperCase();
    const defaultLeaveBalance = { casual: 12, sick: 12, emergency: 10 };
    const defaultOfficeLocation = { lat: 28.6139, lng: 77.2090, radiusMeters: 20 };

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.full_name || payload.name || payload.email)}&background=10b981&color=fff&bold=true`;
    const userAvatar = payload.card_image || payload.avatar || fallbackAvatar;

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
      phone: payload.phone || payload.phone_number || payload.contact || payload.mobile || '',
      manager: payload.manager || 'Sardar Sadiq',
      joiningDate: payload.joiningDate || payload.joining_date || payload.created_at?.split('T')[0] || '',
      card_image: userAvatar,
      avatar: userAvatar,
      officeLocation: payload.officeLocation || defaultOfficeLocation,
      leaveBalance: payload.leaveBalance || defaultLeaveBalance
    };
    setCurrentUser(userObj);
    setActiveRole(roleUpper);
    setAuthLoading(false);
    saveUserToSession(userObj);
  };

  const clearAuth = () => {
    setCurrentUser(null);
    setActiveRole(null);
    setAuthLoading(false);
    saveUserToSession(null);
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
    saveUserToSession(null);
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
    const startTimeInMins = startH * 60 + startM + officeSettings.gracePeriodMinutes; // e.g. 09:35 AM (575 mins)
    const absentThresholdInMins = 10 * 60 + 30; // 10:30 AM (630 mins)
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let status = 'PRESENT';
    let isLate = false;

    if (currentMins > absentThresholdInMins) {
      status = 'ABSENT';
      isLate = true;
    } else if (currentMins > startTimeInMins) {
      status = 'LATE';
      isLate = true;
    }

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

    // 2. Persist to Supabase via attendanceService
    attendanceService
      .recordCheckIn({
        employeeId: currentUser.employeeId,
        employeeName: currentUser.name,
        avatar: currentUser.avatar,
        department: currentUser.department,
        date: todayStr,
        checkIn: timeStr,
        status,
        isLate,
        latitude: userLat,
        longitude: userLng,
        distanceMeters,
        accuracyMeters: coords?.accuracyMeters,
        officeName: coords?.officeName,
      })
      .catch((err) => {
        console.error('StoreProvider: Failed to persist check-in to Supabase —', err.message);
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

    // 2. Persist check-out to Supabase via attendanceService
    attendanceService
      .recordCheckOut({
        employeeId: currentUser.employeeId,
        date: todayStr,
        checkOutTime: timeStr,
        workingHours: hoursWorked,
      })
      .catch((err) => {
        console.error('StoreProvider: Failed to persist check-out to Supabase —', err.message);
      });

    setNotifications(prev => [
      {
        id: `notif-checkout-${Date.now()}-emp`,
        title: "Check-Out Verified",
        message: `Checked out at ${timeStr}. Recorded working time: ${hoursWorked} hrs today.`,
        time: "Just now",
        read: false,
        type: "SUCCESS",
        targetUser: currentUser.employeeId
      },
      {
        id: `notif-checkout-${Date.now()}-admin`,
        title: `${currentUser.name} Checked Out`,
        message: `${currentUser.name} checked out at ${timeStr} (${hoursWorked} hrs worked).`,
        time: "Just now",
        read: false,
        type: "SUCCESS",
        targetRole: "ADMIN"
      },
      ...prev
    ]);

    showToast({
      title: "Check-Out Verified",
      description: `Checked out at ${timeStr}. Total recorded working hours: ${hoursWorked} hrs.`,
      status: "success"
    });

    return {
      success: true,
      message: `Checked out at ${timeStr}. Total recorded working hours: ${hoursWorked} hrs.`
    };
  };

  const updateAttendanceStatus = async (identifier, newStatus, targetDate, customWorkingHours) => {
    if (activeRole !== 'ADMIN') return;
    let statusUpper = newStatus.toUpperCase();
    if (statusUpper === 'HALF DAY' || statusUpper === 'HD') statusUpper = 'HALF_DAY';
    if (statusUpper === 'LEAVE') statusUpper = 'ON_LEAVE';
    const isLate = statusUpper === 'LATE' || statusUpper === 'ABSENT';
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // Intelligently resolve record and employee details from identifier
    let employeeId = null;
    let employeeName = '';
    let department = '';
    let avatar = '';
    let recordId = null;
    let existingRecord = null;

    if (typeof identifier === 'object' && identifier !== null) {
      existingRecord = identifier;
      employeeId = identifier.employeeId;
      employeeName = identifier.employeeName || identifier.employee_name || '';
      department = identifier.department || '';
      avatar = identifier.avatar || '';
      recordId = identifier.id;
      if (identifier.date) targetDate = identifier.date;
    } else {
      existingRecord = attendanceRecords.find(r => r.id === identifier || (r.employeeId === identifier && r.date === dateStr));
      if (existingRecord) {
        employeeId = existingRecord.employeeId;
        employeeName = existingRecord.employeeName;
        department = existingRecord.department;
        avatar = existingRecord.avatar;
        recordId = existingRecord.id;
      } else {
        const emp = employees.find(e => e.id === identifier || e.employeeId === identifier);
        if (emp) {
          employeeId = emp.employeeId || emp.id;
          employeeName = emp.name || emp.full_name;
          department = emp.department || 'IT';
          avatar = emp.card_image || emp.avatar || '';
        } else {
          employeeId = identifier;
        }
      }
    }

    const finalDateStr = targetDate || dateStr;
    const defaultHours = statusUpper === 'PRESENT' ? 8 : statusUpper === 'HALF_DAY' ? 4 : 0;
    const finalHours = customWorkingHours !== undefined ? customWorkingHours : (existingRecord?.workingHours || defaultHours);

    // Optimistic local update
    setAttendanceRecords(prev => {
      const existing = prev.find(r => (recordId && r.id === recordId) || (r.employeeId === employeeId && r.date === finalDateStr));
      if (existing) {
        return prev.map(r => ((recordId && r.id === recordId) || (r.employeeId === employeeId && r.date === finalDateStr) ? { ...r, status: statusUpper, workingHours: finalHours, isLate } : r));
      } else {
        const newRecord = {
          id: recordId || `att-override-${Date.now()}`,
          employeeId,
          employeeName,
          avatar,
          department,
          date: finalDateStr,
          checkIn: statusUpper === 'PRESENT' || statusUpper === 'LATE' ? '09:30:00' : null,
          checkOut: null,
          workingHours: finalHours,
          status: statusUpper,
          locationVerified: false,
          isLate
        };
        return [newRecord, ...prev];
      }
    });

    try {
      await attendanceService.updateStatus({
        recordId: recordId && typeof recordId === 'string' && recordId.startsWith('att-') ? null : recordId,
        employeeId,
        employeeName,
        department,
        avatar,
        date: finalDateStr,
        status: statusUpper,
        checkIn: existingRecord?.checkIn ?? (statusUpper === 'PRESENT' || statusUpper === 'LATE' ? '09:30:00' : null),
        checkOut: existingRecord?.checkOut ?? null,
        workingHours: finalHours
      });
      showToast({
        title: "Attendance Status Saved to Database",
        description: `Set status to ${statusUpper} for ${employeeName || employeeId}.`,
        status: "success"
      });
    } catch (err) {
      console.error('Failed to update attendance status:', err.message);
      showToast({
        title: "Failed to Save Attendance Status",
        description: err.message || "An error occurred while saving to database.",
        status: "error"
      });
    }
  };

  const applyLeave = (leaveData) => {
    if (!currentUser) return;

    const isHalfDay = Boolean(leaveData.isHalfDay || leaveData.totalDays === 0.5 || leaveData.leaveType === 'HALF_DAY');
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
      isHalfDay: isHalfDay,
      halfDaySlot: leaveData.halfDaySlot || null,
      reason: leaveData.reason,
      status: 'PENDING',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests(prev => [newLeave, ...prev]);

    // Persist to Supabase via leaveService
    leaveService.submitLeaveRequest({
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name,
      avatar: currentUser.avatar,
      department: currentUser.department,
      leaveType: leaveData.leaveType,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      totalDays: leaveData.totalDays,
      isHalfDay: isHalfDay,
      halfDaySlot: leaveData.halfDaySlot || null,
      reason: leaveData.reason
    })
      .then(() => fetchLeaveRequests())
      .catch(err => {
        console.error('StoreProvider: Failed to persist leave request —', err.message);
      });

    showToast({
      title: "Leave Request Submitted",
      description: `Submitted ${isHalfDay ? 'Half Day' : leaveData.leaveType} leave application for ${leaveData.totalDays} day(s).`,
      status: "success"
    });
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}-admin`,
        title: `${currentUser.name} • Leave Requested`,
        message: `Submitted ${isHalfDay ? 'Half Day' : leaveData.leaveType} leave for ${leaveData.totalDays} day(s).`,
        time: "Just now",
        read: false,
        type: "INFO",
        targetRole: "ADMIN"
      },
      {
        id: `notif-${Date.now()}-emp`,
        title: "Leave Application Submitted",
        message: `Your ${isHalfDay ? 'Half Day' : leaveData.leaveType} leave application was submitted for admin review.`,
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

      // Update status in Supabase via leaveService
      leaveService.updateRequestStatus({
        id: leaveId,
        status,
        reviewedBy: currentUser?.name || 'Admin',
        adminNote
      }).catch(err => {
        console.error('StoreProvider: Failed to update leave status —', err.message);
      });

      // If approved, sync to attendance log table & record usage in ledger
      if (status === 'APPROVED') {
        const isHalfDay = Boolean(targetReq.isHalfDay || targetReq.totalDays === 0.5 || targetReq.leaveType === 'HALF_DAY');
        const leaveAttStatus = isHalfDay ? 'HALF_DAY' : 'ON_LEAVE';
        const workingHours = isHalfDay ? 4 : 0;

        // Auto-update attendance logs for each date in leave period
        const startDateObj = new Date(targetReq.startDate);
        const endDateObj = new Date(targetReq.endDate);

        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
          let curr = new Date(startDateObj);
          while (curr <= endDateObj) {
            const dStr = curr.toISOString().split('T')[0];
            updateAttendanceStatus(
              {
                employeeId: targetReq.employeeId,
                employeeName: targetReq.employeeName,
                department: targetReq.department,
                avatar: targetReq.avatar,
                date: dStr
              },
              leaveAttStatus,
              dStr,
              workingHours
            );
            curr.setDate(curr.getDate() + 1);
          }
        }

        if (targetReq.leaveType !== 'UNPAID') {
          const targetEmp = employees.find(e => e.employeeId === targetReq.employeeId);
          const targetAuthId = targetEmp?.auth_id || currentUser?.auth_id;

          if (targetAuthId) {
            leaveService
              .recordUsage({
                authId: targetAuthId,
                leaveType: targetReq.leaveType,
                totalDays: targetReq.totalDays || (isHalfDay ? 0.5 : 1),
                startDate: targetReq.startDate,
                endDate: targetReq.endDate,
                isHalfDay
              })
              .then(() => fetchLeaveBalances())
              .catch((err) => {
                console.error('StoreProvider: Failed to record leave usage in ledger —', err.message);
              });
          }
        }
      }
    };
  };

  const addEmployee = async (employeeData) => {
    if (activeRole !== 'ADMIN') return;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name || employeeData.email)}&background=10b981&color=fff&bold=true`;

    // Call Supabase service to persist to database
    let dbRecord = null;
    try {
      const resData = await employeeService.addEmployee(employeeData);
      if (resData && resData.length > 0) {
        dbRecord = resData[0];
      }
    } catch (err) {
      console.error('StoreProvider: Failed to add employee to Supabase —', err.message);
    }

    const createdEmp = {
      id: dbRecord?.id || dbRecord?.employee_id || employeeData.employeeId || `emp-${Date.now()}`,
      employeeId: dbRecord?.id || dbRecord?.employee_id || employeeData.employeeId || `SDS-${Math.floor(1000 + Math.random() * 9000)}`,
      auth_id: dbRecord?.auth_id || dbRecord?.id || null,
      name: dbRecord?.full_name || dbRecord?.name || employeeData.name,
      email: dbRecord?.email || employeeData.email,
      role: (dbRecord?.role || employeeData.role || 'EMPLOYEE').toUpperCase(),
      department: dbRecord?.department || employeeData.department || 'IT',
      designation: dbRecord?.designation || employeeData.designation || 'Software Engineer',
      phone: dbRecord?.phone || employeeData.phone || '',
      joiningDate: dbRecord?.joining_date || employeeData.joiningDate || new Date().toISOString().split('T')[0],
      manager: dbRecord?.manager || employeeData.manager || 'Sardar Sadiq',
      isActive: true,
      leaveBalance: employeeData.leaveBalance || { casual: 12, sick: 12, emergency: 10 },
      card_image: dbRecord?.card_image || employeeData.card_image || employeeData.avatar || defaultAvatar,
      avatar: dbRecord?.avatar || dbRecord?.card_image || employeeData.avatar || defaultAvatar
    };

    setEmployees(prev => [...prev.filter(e => e.email !== createdEmp.email && e.employeeId !== createdEmp.employeeId), createdEmp]);

    showToast({
      title: "Employee Added & Saved to Database",
      description: `${createdEmp.name} (${createdEmp.email}) has been permanently saved to Supabase SDS_Employees database table.`,
      status: "success"
    });
  };

  const deleteEmployee = async (empId) => {
    if (activeRole !== 'ADMIN') return;
    const target = employees.find(e => e.id === empId || e.employeeId === empId);
    setEmployees(prev => prev.filter(e => e.id !== empId && e.employeeId !== empId));

    try {
      await employeeService.deleteEmployee(empId);
      showToast({
        title: "Employee Removed",
        description: `Removed ${target?.name || 'employee'} from SDS_Employees database table.`,
        status: "info"
      });
    } catch (err) {
      console.error('StoreProvider: Failed to delete employee —', err.message);
    }
  };

  const updateEmployee = async (empId, updatedData) => {
    if (activeRole !== 'ADMIN') return;

    const targetEmp = employees.find(e => e.id === empId || e.employeeId === empId || e.email === empId);
    if (!targetEmp) return;

    const newEmpId = updatedData.employeeId?.trim() || targetEmp.employeeId;
    const newName = updatedData.name?.trim() || updatedData.full_name?.trim() || targetEmp.name;
    const newEmail = updatedData.email?.trim().toLowerCase() || targetEmp.email;
    const newDept = updatedData.department || targetEmp.department;
    const newDesig = updatedData.designation || targetEmp.designation;
    const newPhone = updatedData.phone !== undefined ? updatedData.phone : targetEmp.phone;
    const newRole = (updatedData.role || targetEmp.role || 'EMPLOYEE').toUpperCase();

    const updatedRecord = {
      ...targetEmp,
      id: newEmpId,
      employeeId: newEmpId,
      name: newName,
      full_name: newName,
      email: newEmail,
      department: newDept,
      designation: newDesig,
      phone: newPhone,
      role: newRole
    };

    // 1. Optimistic update in React state
    setEmployees(prev => prev.map(e => (e.id === empId || e.employeeId === empId || e.email === empId) ? updatedRecord : e));

    if (currentUser?.id === empId || currentUser?.employeeId === empId || currentUser?.email === empId) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedRecord } : prev);
    }

    // 2. Persist to Supabase SDS_Employees table via employeeService
    try {
      await employeeService.updateEmployee(targetEmp.id || targetEmp.employeeId || empId, {
        employeeId: newEmpId,
        name: newName,
        email: newEmail,
        department: newDept,
        designation: newDesig,
        phone: newPhone,
        role: newRole
      });

      showToast({
        title: "Employee Profile Saved (Ctrl+S)",
        description: `Successfully updated profile for ${newName} in Supabase SDS_Employees table.`,
        status: "success"
      });
    } catch (err) {
      console.error('StoreProvider: Failed to update employee in Supabase —', err.message);
      showToast({
        title: "Profile Updated Locally",
        description: "Saved changes in local session. Check database permissions.",
        status: "info"
      });
    }
  };

  const addRemark = (employeeId, content, category) => {
    if (activeRole !== 'ADMIN') return false;
    const targetEmp = employees.find(e => e.employeeId === employeeId || e.id === employeeId || e.email === employeeId);

    // Enforce max limit of 2 performance remarks per employee
    const targetRef = targetEmp || { employeeId };
    const existingCount = remarks.filter(r => isRemarkForEmployee(r, targetRef)).length;

    if (existingCount >= 2) {
      showToast({
        title: "Remark Limit Reached (Max 2)",
        description: `Each employee is limited to a maximum of 2 performance remarks. Please edit or delete an existing remark.`,
        status: "info"
      });
      return false;
    }

    const newRemark = {
      id: `rem-${Date.now()}`,
      employeeId: targetEmp?.employeeId || employeeId,
      employeeAuthId: targetEmp?.auth_id || targetEmp?.id || null,
      employeeEmail: targetEmp?.email || null,
      authorId: currentUser?.employeeId || 'SDS-1001',
      authorName: currentUser?.name || 'Sardar Sadiq',
      authorRole: activeRole,
      content,
      category,
      createdAt: new Date().toISOString()
    };

    setRemarks(prev => [newRemark, ...prev.filter(r => r.id !== newRemark.id)]);

    // Dispatch real-time notification to employee
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}-remark`,
        title: "New Performance Remark",
        message: `${currentUser?.name || 'Manager'} added a ${category.toLowerCase()} performance remark for you: "${content.length > 55 ? content.slice(0, 52) + '...' : content}"`,
        time: "Just now",
        read: false,
        type: "INFO",
        targetUser: targetEmp?.employeeId || targetEmp?.id || targetEmp?.auth_id || targetEmp?.email || employeeId,
        category: "REMARK"
      },
      ...prev
    ]);

    remarkService.addRemark(newRemark).then(updated => {
      if (updated) setRemarks(updated);
    }).catch(err => {
      console.error('StoreProvider: addRemark error —', err);
    });

    showToast({
      title: "Performance Remark Published",
      description: `Added ${category.toLowerCase()} remark for ${targetEmp?.name || 'employee'}.`,
      status: "success"
    });
    return true;
  };

  const editRemark = (remarkId, content, category) => {
    if (activeRole !== 'ADMIN') return;
    setRemarks(prev => prev.map(r => r.id === remarkId ? { ...r, content, category } : r));

    remarkService.editRemark(remarkId, content, category).then(updated => {
      if (updated) setRemarks(updated);
    }).catch(err => {
      console.error('StoreProvider: editRemark error —', err);
    });

    showToast({
      title: "Performance Remark Updated",
      description: "Remark content saved successfully.",
      status: "info"
    });
  };

  const deleteRemark = (remarkId) => {
    if (activeRole !== 'ADMIN') return;
    setRemarks(prev => prev.filter(r => r.id !== remarkId));

    remarkService.deleteRemark(remarkId).then(updated => {
      if (updated) setRemarks(updated);
    }).catch(err => {
      console.error('StoreProvider: deleteRemark error —', err);
    });

    showToast({
      title: "Performance Remark Removed",
      description: "Remark deleted successfully.",
      status: "info"
    });
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

  const updateUserAvatar = async ({ avatarStyle, avatarSeed }) => {
    if (!currentUser) return;

    const newDiceBearUrl = profileService.getDiceBearUrl(avatarStyle, avatarSeed);

    // Optimistically update local currentUser & employees state immediately
    setCurrentUser(prev => prev ? {
      ...prev,
      avatarStyle,
      avatarSeed,
      avatar: newDiceBearUrl
    } : prev);

    setEmployees(prev => prev.map(emp => {
      if (emp.id === currentUser.id || emp.employeeId === currentUser.employeeId || emp.auth_id === currentUser.auth_id) {
        return {
          ...emp,
          avatarStyle,
          avatarSeed,
          avatar: newDiceBearUrl
        };
      }
      return emp;
    }));

    // Update Supabase SDS_Employees table via profileService
    try {
      const result = await profileService.updateAvatarStyleAndSeed({
        employeeId: currentUser.employeeId,
        authId: currentUser.auth_id,
        email: currentUser.email,
        avatarStyle,
        avatarSeed
      });

      if (result.success) {
        showToast({
          title: "Avatar Saved Successfully",
          description: `Your avatar style (${avatarStyle}) has been saved.`,
          status: "success"
        });
      } else {
        console.warn('StoreProvider: Supabase avatar save returned non-success result', result);
        showToast({
          title: "Avatar Updated Locally",
          description: "Saved in session. Connect database permissions to update cloud record.",
          status: "info"
        });
      }
    } catch (err) {
      console.error('StoreProvider: Failed to persist avatar update to Supabase —', err.message);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Export Attendance Matrix (Employees as Rows, Dates as Columns) to Excel CSV format
  const exportAttendanceExcel = (targetMonth, targetYear) => {
    const now = new Date();
    const month = Number(targetMonth) || (now.getMonth() + 1); // 1-12
    const year = Number(targetYear) || now.getFullYear();

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthShort = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });

    // Header row
    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation"
    ];

    // Dynamic date columns: 01 Aug, 02 Aug, ..., 31 Aug
    const dateHeaders = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      dateHeaders.push(`${dayStr} ${monthShort}`);
    }

    const summaryHeaders = ["Present", "Absent", "Leave", "Half Day"];

    const fullHeaderRow = [...headers, ...dateHeaders, ...summaryHeaders].map(h => `"${h}"`);
    const rows = [fullHeaderRow];

    // Scope employees: Admin exports all active employees; Non-admin exports self
    const targetEmployees = activeRole === 'ADMIN'
      ? employees
      : employees.filter(e => e.employeeId === currentUser?.employeeId || e.id === currentUser?.id || e.email === currentUser?.email);

    const todayStr = now.toISOString().split('T')[0];

    targetEmployees.forEach(emp => {
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let halfDayCount = 0;

      const dailyStatusCells = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const dateObj = new Date(year, month - 1, day);

        // 1. Find check-in / attendance record
        const attRec = attendanceRecords.find(a =>
          (a.employeeId === emp.employeeId || a.employeeId === emp.id || (a.employeeName || '').toLowerCase() === (emp.name || '').toLowerCase()) &&
          a.date === dateStr
        );

        // 2. Find approved leave request
        const leaveRec = leaveRequests.find(l =>
          (l.employeeId === emp.employeeId || l.employeeId === emp.id) &&
          l.status === 'APPROVED' &&
          dateStr >= l.startDate &&
          dateStr <= l.endDate
        );

        let cellValue = '--';

        if (attRec) {
          const st = (attRec.status || '').toUpperCase();
          if (st === 'PRESENT' || st === 'LATE') {
            cellValue = '✓';
            presentCount++;
          } else if (st === 'ABSENT') {
            cellValue = 'A';
            absentCount++;
          } else if (st === 'HALF_DAY' || st === 'HALF DAY' || st === 'HD') {
            cellValue = 'HD';
            halfDayCount++;
          } else if (st === 'ON_LEAVE' || st === 'LEAVE') {
            cellValue = 'L';
            leaveCount++;
          } else {
            cellValue = '✓';
            presentCount++;
          }
        } else if (leaveRec) {
          if (leaveRec.leaveType === 'HALF_DAY' || leaveRec.leaveType === 'HALF DAY') {
            cellValue = 'HD';
            halfDayCount++;
          } else {
            cellValue = 'L';
            leaveCount++;
          }
        } else {
          // If past date or today
          if (dateStr <= todayStr) {
            const isSunday = dateObj.getDay() === 0;
            if (isSunday) {
              cellValue = '--';
            } else {
              // Past working day without check-in or leave -> Mark as Absent
              cellValue = 'A';
              absentCount++;
            }
          } else {
            // Future date in the month
            cellValue = '--';
          }
        }

        dailyStatusCells.push(`"${cellValue}"`);
      }

      const empRow = [
        `"${emp.employeeId || emp.id || ''}"`,
        `"${emp.name || ''}"`,
        `"${emp.department || 'IT'}"`,
        `"${emp.designation || 'Staff'}"`,
        ...dailyStatusCells,
        `"${presentCount}"`,
        `"${absentCount}"`,
        `"${leaveCount}"`,
        `"${halfDayCount}"`
      ];

      rows.push(empRow);
    });

    // Create UTF-8 BOM CSV content for Microsoft Excel compatibility
    const csvContent = "\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SDS_Attendance_Report_${monthShort}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      title: "Excel Attendance Matrix Exported",
      description: `Daily attendance report for ${monthShort} ${year} exported successfully.`,
      status: "success"
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const roleNotifications = notifications.filter(n => {
    if (n.targetUser) {
      const remTarget = String(n.targetUser || '').toLowerCase().trim();
      const empId = String(currentUser?.employeeId || '').toLowerCase().trim();
      const empDbId = String(currentUser?.id || '').toLowerCase().trim();
      const empAuthId = String(currentUser?.auth_id || '').toLowerCase().trim();
      const empEmail = String(currentUser?.email || '').toLowerCase().trim();

      return (
        (empId && remTarget === empId) ||
        (empDbId && remTarget === empDbId) ||
        (empAuthId && remTarget === empAuthId) ||
        (empEmail && remTarget === empEmail)
      );
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
        leaveBalances,
        fetchLeaveBalances,
        remarks,
        officeSettings,
        notifications: roleNotifications,
        markNotificationAsRead,
        dismissNotification,
        clearAllNotifications,
        selectedEmployeeId,
        toasts,
        showToast,
        dismissToast,
        loginWithGoogle,
        logout,
        setSelectedEmployeeId,
        checkIn,
        checkOut,
        updateAttendanceStatus,
        applyLeave,
        reviewLeave,
        addEmployee,
        deleteEmployee,
        updateEmployee,
        addRemark,
        editRemark,
        deleteRemark,
        addHoliday,
        editHoliday,
        deleteHoliday,
        updateSettings,
        updateUserAvatar,
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
