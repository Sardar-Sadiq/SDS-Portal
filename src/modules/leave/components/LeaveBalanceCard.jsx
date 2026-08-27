import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/motion/animated-number';
import { useStore } from '@/context/store-context';
import { supabase } from '@/lib/supabaseClient';
import { History, Calendar } from 'lucide-react';
import { LedgerHistoryDrawer } from './LedgerHistoryDrawer';

export const LeaveBalanceCard = ({ pendingCount = 0 }) => {
  const { currentUser, leaveBalances, calculateEmployeeLeaveBalances } = useStore();
  const [policies, setPolicies] = useState({
    casual: { monthly_accrual: 1.00, annual_cap: 12.00 },
    sick: { monthly_accrual: 1.00, annual_cap: 12.00 },
    emergency: { monthly_accrual: 0.83, annual_cap: 10.00 },
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const { data, error } = await supabase.from('leave_policies').select('*');
        if (data && data.length > 0) {
          const map = {};
          data.forEach(p => {
            let type = p.leave_type;
            if (type === 'annual') type = 'emergency';
            map[type] = p;
          });
          setPolicies(prev => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error('Error fetching leave_policies:', err);
      }
    };
    fetchPolicies();
  }, []);

  const currentBal = calculateEmployeeLeaveBalances ? calculateEmployeeLeaveBalances(currentUser) : leaveBalances;
  const casualBalance = currentBal?.casual ?? leaveBalances?.casual ?? currentUser?.leaveBalance?.casual ?? 12;
  const sickBalance = currentBal?.sick ?? leaveBalances?.sick ?? currentUser?.leaveBalance?.sick ?? 12;
  const emergencyBalance = currentBal?.emergency ?? leaveBalances?.emergency ?? leaveBalances?.annual ?? currentUser?.leaveBalance?.emergency ?? currentUser?.leaveBalance?.annual ?? 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
          Ledger-Backed Leave Quotas ({new Date().getFullYear()})
        </span>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors font-medium"
        >
          <History className="w-3.5 h-3.5" />
          <span>View Audit History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-stretch">
        {/* Casual Leave */}
        <Card className="p-4 h-full flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">
              Casual Leave
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
              +{policies.casual.monthly_accrual}/mo
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              <AnimatedNumber value={casualBalance} />{' '}
              <span className="text-xs font-normal text-neutral-400">/ {policies.casual.annual_cap} days</span>
            </p>
          </div>
        </Card>

        {/* Sick Leave */}
        <Card className="p-4 h-full flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">
              Sick Leave
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
              +{policies.sick.monthly_accrual}/mo
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              <AnimatedNumber value={sickBalance} />{' '}
              <span className="text-xs font-normal text-neutral-400">/ {policies.sick.annual_cap} days</span>
            </p>
          </div>
        </Card>

        {/* Emergency Leave */}
        <Card className="p-4 h-full flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">
              Emergency Leave
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
              +{policies.emergency.monthly_accrual}/mo
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              <AnimatedNumber value={emergencyBalance} />{' '}
              <span className="text-xs font-normal text-neutral-400">/ {policies.emergency.annual_cap} days</span>
            </p>
          </div>
        </Card>

        {/* Pending Requests */}
        <Card className="p-4 h-full flex flex-col justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-400 font-mono font-medium uppercase">
              Total Pending
            </span>
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              <AnimatedNumber value={pendingCount} />
              <span className="text-xs font-normal text-neutral-400 ml-1">requests</span>
            </p>
          </div>
        </Card>
      </div>

      <LedgerHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
