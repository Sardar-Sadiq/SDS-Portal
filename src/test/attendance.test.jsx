import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { getDistanceMeters, resolveNearestOffice, clearOfficeLocationsCache } from '@/modules/attendance/geofence';
import { supabase } from '@/lib/supabaseClient';
import { EmployeeAttendanceReport } from '@/modules/attendance/components/EmployeeAttendanceReport';
import { StoreProvider, useStore } from '@/context/store-context';

describe('Attendance & Geofencing Module', () => {
  beforeEach(() => {
    clearOfficeLocationsCache();
    vi.restoreAllMocks();
  });

  describe('getDistanceMeters', () => {
    it('calculates 0 meters for identical coordinates', () => {
      const distance = getDistanceMeters(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });

    it('calculates distance correctly between two known GPS coordinates', () => {
      const distance = getDistanceMeters(37.7749, -122.4194, 37.7759, -122.4194);
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(125);
    });
  });

  describe('resolveNearestOffice', () => {
    it('resolves nearest office within geofence radius', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ id: 'off-1', name: 'HQ', latitude: 37.7749, longitude: -122.4194, radius_meters: 500 }],
            error: null
          })
        })
      });

      const result = await resolveNearestOffice(37.7749, -122.4194);
      expect(result).toBeDefined();
      expect(result.distanceMeters).toBe(0);
      expect(result.isWithinRadius).toBe(true);
    });

    it('flags location outside geofence radius when far away', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ id: 'off-1', name: 'HQ', latitude: 37.7749, longitude: -122.4194, radius_meters: 250 }],
            error: null
          })
        })
      });

      const result = await resolveNearestOffice(40.7128, -74.0060);
      expect(result.isWithinRadius).toBe(false);
      expect(result.distanceMeters).toBeGreaterThan(10000);
    });
  });

  describe('EmployeeAttendanceReport ABSENT Label Tests', () => {
    it('renders ABSENT label when checkIn is null and status is ABSENT', () => {
      const logs = [
        {
          day: 'Monday',
          date: '2026-08-10',
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          status: 'ABSENT'
        }
      ];

      render(<EmployeeAttendanceReport weeklyCheckInLogs={logs} />);
      expect(screen.getByText('ABSENT')).toBeInTheDocument();
      expect(screen.getByText('Not Logged by 10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('ABSENT (NOT LOGGED)')).toBeInTheDocument();
    });

    it('renders Not Logged Yet label when status is NOT_LOGGED', () => {
      const logs = [
        {
          day: 'Tuesday',
          date: '2026-08-11',
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          status: 'NOT_LOGGED'
        }
      ];

      render(<EmployeeAttendanceReport weeklyCheckInLogs={logs} />);
      expect(screen.getByText('Not Logged Yet')).toBeInTheDocument();
      expect(screen.getByText('Cutoff: 10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('NOT LOGGED YET')).toBeInTheDocument();
    });
  });

  describe('Excel Attendance Export Matrix Tests', () => {
    it('generates correct date columns and daily indicators (✓, A, L, HD) with summary counts', () => {
      let createdCsvContent = '';

      const originalCreateObjectURL = global.URL.createObjectURL;
      global.URL.createObjectURL = vi.fn().mockImplementation((blob) => {
        return 'blob:fake-url';
      });

      const clickSpy = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const elem = originalCreateElement(tagName);
        if (tagName === 'a') {
          elem.click = clickSpy;
        }
        return elem;
      });

      const originalBlob = global.Blob;
      global.Blob = class MockBlob extends originalBlob {
        constructor(parts, options) {
          super(parts, options);
          createdCsvContent = parts.join('');
        }
      };

      // Use top-level StoreProvider and useStore
      const TestComponent = () => {
        const { exportAttendanceExcel } = useStore();
        return (
          <button onClick={() => exportAttendanceExcel(8, 2026)}>
            Export Excel
          </button>
        );
      };

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      const exportBtn = screen.getByText('Export Excel');
      act(() => {
        exportBtn.click();
      });

      expect(clickSpy).toHaveBeenCalled();
      expect(createdCsvContent).toContain('"Employee ID"');
      expect(createdCsvContent).toContain('"01 Aug"');
      expect(createdCsvContent).toContain('"02 Aug"');
      expect(createdCsvContent).toContain('"31 Aug"');
      expect(createdCsvContent).toContain('"Present"');
      expect(createdCsvContent).toContain('"Absent"');
      expect(createdCsvContent).toContain('"Leave"');
      expect(createdCsvContent).toContain('"Half Day"');

      // Verify UTF-8 BOM prefix
      expect(createdCsvContent.startsWith('\uFEFF')).toBe(true);

      // Restore mocks
      global.URL.createObjectURL = originalCreateObjectURL;
      global.Blob = originalBlob;
      vi.restoreAllMocks();
    });
  });

  describe('Shadcn Calendar Component & Attendance Single-Day Filtering Tests', () => {
    it('renders Calendar component with day headers and selects date when clicked', async () => {
      const { Calendar } = await import('@/components/ui/calendar');
      const handleSelect = vi.fn();

      render(<Calendar selectedDate="2026-08-17" onSelect={handleSelect} />);

      expect(screen.getByText('August 2026')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();

      const day17 = screen.getByText('17');
      act(() => {
        day17.click();
      });

      expect(handleSelect).toHaveBeenCalledWith('2026-08-17', expect.any(Date));
    });

    it('renders AttendanceView with default single-day filter for Today in Attendance Ledger', async () => {
      const { AttendanceView } = await import('@/modules/attendance/components/AttendanceView');

      render(
        <StoreProvider>
          <AttendanceView onOpenCheckIn={vi.fn()} />
        </StoreProvider>
      );

      const ledgerTab = screen.getByText('Full Attendance Logs');
      act(() => {
        ledgerTab.click();
      });

      const todayStr = new Date().toISOString().split('T')[0];
      expect(screen.getByText(`Today (${todayStr})`)).toBeInTheDocument();
    });
  });

  describe('Admin Attendance Status Upsert & Persistence Tests', () => {
    it('calls supabase.from("SDS_Attendance").upsert with correct employee_id, status, and metadata', async () => {
      const { attendanceService } = await import('@/modules/attendance/services/attendanceService');
      const selectSpy = vi.fn().mockResolvedValue({
        data: [{ id: 1, employee_id: 'SDS-1001', status: 'ABSENT', is_late: true }],
        error: null
      });
      const upsertSpy = vi.fn().mockReturnValue({
        select: selectSpy
      });

      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: upsertSpy
      });

      await attendanceService.updateStatus({
        employeeId: 'SDS-1001',
        employeeName: 'John Doe',
        department: 'Engineering',
        avatar: 'https://avatar.url',
        date: '2026-08-19',
        status: 'ABSENT'
      });

      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_id: 'SDS-1001',
          employee_name: 'John Doe',
          department: 'Engineering',
          date: '2026-08-19',
          status: 'ABSENT',
          is_late: true
        }),
        { onConflict: 'employee_id,date' }
      );
    });
  });

  describe('Grace Period Configuration Tests', () => {
    it('initializes officeSettings with a 5-minute grace period by default', async () => {
      const { INITIAL_OFFICE_SETTINGS } = await import('@/lib/mock-data');
      expect(INITIAL_OFFICE_SETTINGS.gracePeriodMinutes).toBe(5);
    });
  });
});




