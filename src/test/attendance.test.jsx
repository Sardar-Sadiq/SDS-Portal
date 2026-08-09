import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDistanceMeters, resolveNearestOffice, clearOfficeLocationsCache } from '@/modules/attendance/geofence';
import { supabase } from '@/lib/supabaseClient';

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
});
