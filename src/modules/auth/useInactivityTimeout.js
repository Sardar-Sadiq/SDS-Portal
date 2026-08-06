import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/**
 * Tracks user activity (mouse movement, keypress, click, scroll) and automatically
 * signs out the user via Supabase Auth after the specified inactivity timeout.
 * 
 * @param {Function} onTimeout - Callback executed on inactivity timeout
 * @param {number} timeoutMs - Inactivity threshold in milliseconds (default: 8h)
 */
export const useInactivityTimeout = (onTimeout, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out on inactivity:', err);
      }
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);
  };

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Start timer on mount
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [timeoutMs, onTimeout]);
};

export default useInactivityTimeout;
