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

export const StoreProvider = ({ children }) => {
  const { toasts, showToast, dismissToast, clearToasts } = useAnimatedToastStack();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [remarks, setRemarks] = useState(INITIAL_REMARKS);
  const [officeSettings, setOfficeSettings] = useState(INITIAL_OFFICE_SETTINGS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("emp-002");
  const [leaveBalances, setLeaveBalances] = useState({ casual: 12, sick: 8, annual: 15 });

  const NOTIFICATIONS_STORAGE_KEY = 'sds_notifications_v2';
  const getInitialNotifications = () => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const [notifications, setNotifications] = useState(getInitialNotifications);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

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
          let sdsData = null;

          try {
            const { data } = await supabase
              .from('SDS_Employees')
              .select('*');
            sdsData = data;
          } catch (e) {
            sdsData = null;
          }

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

            const localCache = profileService.getLocalAvatar(userEmail);
            const avatarStyle = employee.avatar_style || localCache?.avatarStyle || 'lorelei';
            const avatarSeed = employee.avatar_seed || localCache?.avatarSeed || employee.id || session.user.id;
            const diceBearUrl = profileService.getDiceBearUrl(avatarStyle, avatarSeed);
            const userAvatar = (employee.avatar && !employee.avatar.includes('ui-avatars') && !employee.avatar.includes('unavatar.io'))
              ? employee.avatar
              : diceBearUrl;

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
              avatarStyle: avatarStyle,
              avatarSeed: avatarSeed,
              avatar: userAvatar,
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
        setLeaveRequests(requests);
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
    const defaultLeaveBalance = { casual: 12, sick: 8, annual: 15 };
    const defaultOfficeLocation = { lat: 28.6139, lng: 77.2090, radiusMeters: 500 };

    const localCache = profileService.getLocalAvatar(payload.email);
    const avatarStyle = payload.avatarStyle || payload.avatar_style || localCache?.avatarStyle || 'lorelei';
    const avatarSeed = payload.avatarSeed || payload.avatar_seed || localCache?.avatarSeed || payload.id;
    const diceBearUrl = profileService.getDiceBearUrl(avatarStyle, avatarSeed);
    const userAvatar = payload.avatar || localCache?.avatarUrl || diceBearUrl;

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
      avatarStyle: avatarStyle,
      avatarSeed: avatarSeed,
      avatar: userAvatar,
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
      reason: leaveData.reason
    }).catch(err => {
      console.error('StoreProvider: Failed to persist leave request —', err.message);
    });

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

      // Update status in Supabase via leaveService
      leaveService.updateRequestStatus({
        id: leaveId,
        status,
        reviewedBy: currentUser?.name || 'Admin',
        adminNote
      }).catch(err => {
        console.error('StoreProvider: Failed to update leave status —', err.message);
      });

      // If approved, insert usage entry into leave_ledger via leaveService
      if (status === 'APPROVED' && targetReq.leaveType !== 'UNPAID') {
        const targetEmp = employees.find(e => e.employeeId === targetReq.employeeId);
        const targetAuthId = targetEmp?.auth_id || currentUser?.auth_id;

        if (targetAuthId) {
          leaveService
            .recordUsage({
              authId: targetAuthId,
              leaveType: targetReq.leaveType,
              totalDays: targetReq.totalDays || 1,
              startDate: targetReq.startDate,
              endDate: targetReq.endDate,
            })
            .then(() => fetchLeaveBalances())
            .catch((err) => {
              console.error('StoreProvider: Failed to record leave usage in ledger —', err.message);
            });
        }
      }
    }
  };

  const addEmployee = async (employeeData) => {
    if (activeRole !== 'ADMIN') return;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name || employeeData.email)}&background=10b981&color=fff&bold=true`;
    const newEmp = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      avatar: employeeData.avatar || defaultAvatar
    };
    setEmployees(prev => [...prev, newEmp]);

    // Persist directly to Supabase SDS_Employees table
    try {
      await employeeService.addEmployee(employeeData);
      showToast({
        title: "Employee Added",
        description: `${employeeData.name} (${employeeData.email}) saved to SDS_Employees in Supabase.`,
        status: "success"
      });
    } catch (err) {
      console.error('StoreProvider: Failed to add employee to Supabase —', err.message);
    }
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
        applyLeave,
        reviewLeave,
        addEmployee,
        deleteEmployee,
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
