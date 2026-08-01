'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE, INITIAL_LEAVES, INITIAL_REMARKS, INITIAL_OFFICE_SETTINGS } from '@/lib/mock-data';

const StoreContext = createContext(undefined);

export const StoreProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(INITIAL_EMPLOYEES[0]);
  const [activeRole, setActiveRole] = useState(INITIAL_EMPLOYEES[0].role);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVES);
  const [remarks, setRemarks] = useState(INITIAL_REMARKS);
  const [officeSettings, setOfficeSettings] = useState(INITIAL_OFFICE_SETTINGS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("emp-002");
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "New Leave Application",
      message: "Elena Rostova applied for 2 days of Casual Leave.",
      time: "10 mins ago",
      read: false,
      type: "INFO"
    },
    {
      id: "notif-2",
      title: "Attendance SLA Check",
      message: "4 employees checked in before 09:00 AM SLA today.",
      time: "1 hour ago",
      read: true,
      type: "SUCCESS"
    }
  ]);

  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.role);
    }
  }, [currentUser]);

  const loginWithGoogle = async (email) => {
    const targetEmail = email || 'sardar.sadiq@spiritdatasolutions.com';
    const match = employees.find(e => e.email.toLowerCase() === targetEmail.toLowerCase());
    
    if (match) {
      setCurrentUser(match);
      setActiveRole(match.role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const checkIn = (coords) => {
    if (!currentUser) return { success: false, message: "Not logged in" };

    const todayStr = new Date().toISOString().split('T')[0];
    const existing = attendanceRecords.find(a => a.employeeId === currentUser.employeeId && a.date === todayStr);

    if (existing && existing.checkIn) {
      return { success: false, message: `You have already checked in today at ${existing.checkIn}.` };
    }

    const userLat = coords?.lat ?? officeSettings.geoFence.lat;
    const userLng = coords?.lng ?? officeSettings.geoFence.lng;

    const R = 6371e3;
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (officeSettings.geoFence.lat * Math.PI) / 180;
    const Δφ = ((officeSettings.geoFence.lat - userLat) * Math.PI) / 180;
    const Δλ = ((officeSettings.geoFence.lng - userLng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    if (distanceMeters > officeSettings.geoFence.radiusMeters) {
      return {
        success: false,
        message: `GPS Geo-fence error: You are ${distanceMeters}m away from office. Maximum allowed radius is ${officeSettings.geoFence.radiusMeters}m.`
      };
    }

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
      isLate
    };

    setAttendanceRecords(prev => [newRecord, ...prev.filter(r => !(r.employeeId === currentUser.employeeId && r.date === todayStr))]);

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

    setAttendanceRecords(updated);

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
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: "Leave Requested",
        message: `${currentUser.name} submitted a leave request for ${leaveData.totalDays} day(s).`,
        time: "Just now",
        read: false,
        type: "INFO"
      },
      ...prev
    ]);
  };

  const reviewLeave = (leaveId, status, adminNote) => {
    if (activeRole !== 'ADMIN') return;

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

    // 1. Compile attendance records
    attendanceRecords.forEach(rec => {
      const emp = employees.find(e => e.employeeId === rec.employeeId);
      // Check matching leave for that date
      const matchingLeave = leaveRequests.find(l => 
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
    leaveRequests.filter(l => l.status === 'APPROVED').forEach(leave => {
      const emp = employees.find(e => e.employeeId === leave.employeeId);
      const existsInAtt = attendanceRecords.some(a => a.employeeId === leave.employeeId && a.date >= leave.startDate && a.date <= leave.endDate);
      
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
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        activeRole,
        employees,
        attendanceRecords,
        leaveRequests,
        remarks,
        officeSettings,
        notifications,
        selectedEmployeeId,
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
