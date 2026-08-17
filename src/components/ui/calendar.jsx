'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Calendar = ({
  selectedDate, // 'YYYY-MM-DD' string or Date object
  onSelect,     // (dateStr: 'YYYY-MM-DD', dateObj: Date) => void
  className = '',
  minDate,
  maxDate
}) => {
  const parseInitialDate = () => {
    if (!selectedDate) return new Date();
    if (typeof selectedDate === 'string') {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    return new Date(selectedDate);
  };

  const initialDate = parseInitialDate();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate days for the calendar grid
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const totalDays = getDaysInMonth(year, month);

  // First day of month (0 is Sun, 1 is Mon... convert so Mon=0, Sun=6)
  const rawFirstDayIndex = new Date(year, month, 1).getDay();
  const firstDayOffset = rawFirstDayIndex === 0 ? 6 : rawFirstDayIndex - 1;

  // Previous month days for padding
  const prevMonthTotalDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
  const prevPaddingDays = Array.from({ length: firstDayOffset }, (_, i) => {
    const dayNum = prevMonthTotalDays - firstDayOffset + 1 + i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    return { dayNum, isCurrentMonth: false, month: prevM, year: prevY };
  });

  // Current month days
  const currentDays = Array.from({ length: totalDays }, (_, i) => ({
    dayNum: i + 1,
    isCurrentMonth: true,
    month,
    year
  }));

  // Next month padding days to complete 6 rows (42 cells total)
  const remainingCells = 42 - (prevPaddingDays.length + currentDays.length);
  const nextPaddingDays = Array.from({ length: remainingCells }, (_, i) => {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    return { dayNum: i + 1, isCurrentMonth: false, month: nextM, year: nextY };
  });

  const allCalendarDays = [...prevPaddingDays, ...currentDays, ...nextPaddingDays];

  // Helper formatting for ISO 'YYYY-MM-DD'
  const formatDateStr = (y, m, d) => {
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    return `${y}-${mStr}-${dStr}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedStr = typeof selectedDate === 'string'
    ? selectedDate
    : selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : '';

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dayObj) => {
    const dateStr = formatDateStr(dayObj.year, dayObj.month, dayObj.dayNum);
    const dateObjInstance = new Date(dayObj.year, dayObj.month, dayObj.dayNum);
    if (onSelect) {
      onSelect(dateStr, dateObjInstance);
    }
  };

  const handleTodayClick = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    const tStr = now.toISOString().split('T')[0];
    if (onSelect) {
      onSelect(tStr, now);
    }
  };

  return (
    <div className={`w-72 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl select-none ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-900 dark:text-white">
          <CalendarIcon className="w-4 h-4 text-emerald-500" />
          <span>{monthNames[month]} {year}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 py-2 text-center text-[11px] font-semibold font-mono text-neutral-400">
        {dayHeaders.map((dh) => (
          <div key={dh} className="py-1">{dh}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {allCalendarDays.map((item, index) => {
          const dateStr = formatDateStr(item.year, item.month, item.dayNum);
          const isToday = dateStr === todayStr;
          const isSelected = selectedStr && dateStr === selectedStr;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectDay(item)}
              className={`
                h-8 w-8 mx-auto rounded-xl text-xs font-medium transition-all flex items-center justify-center relative
                ${!item.isCurrentMonth ? 'text-neutral-300 dark:text-neutral-700 opacity-60' : 'text-neutral-800 dark:text-neutral-200'}
                ${isSelected ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20 dark:bg-emerald-500 hover:bg-emerald-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                ${isToday && !isSelected ? 'border border-emerald-500 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30' : ''}
              `}
            >
              {item.dayNum}
              {isToday && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <button
          type="button"
          onClick={handleTodayClick}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Select Today
        </button>

        {selectedStr && (
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
            {selectedStr}
          </span>
        )}
      </div>
    </div>
  );
};
