import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/context/store-context';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export const LedgerHistoryDrawer = ({ isOpen, onClose }) => {
  const { currentUser } = useStore();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser?.auth_id) return;

    const fetchLedger = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leave_ledger')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch leave_ledger:', error.message);
        } else if (data) {
          setLedgerEntries(data);
        }
      } catch (err) {
        console.error('Error reading leave_ledger:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [isOpen, currentUser?.auth_id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Ledger Audit History"
      description="Immutable ledger record of all leave accruals, usages, and admin adjustments"
    >
      <div className="space-y-4 max-h-[65vh] flex flex-col">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
            <span>Fetching ledger audit records...</span>
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            No ledger entries found for the current year.
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-400 uppercase text-[10px] font-mono tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3 font-normal">Date</th>
                  <th className="py-2.5 px-3 font-normal">Type</th>
                  <th className="py-2.5 px-3 font-normal">Category</th>
                  <th className="py-2.5 px-3 font-normal text-right">Amount</th>
                  <th className="py-2.5 px-3 font-normal">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {ledgerEntries.map((item) => {
                  const isPositive = Number(item.amount) > 0;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="py-2.5 px-3 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            item.entry_type === 'accrual'
                              ? 'success'
                              : item.entry_type === 'usage'
                              ? 'error'
                              : 'warning'
                          }
                          className="capitalize text-[10px]"
                        >
                          {item.entry_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                        {item.leave_type}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {isPositive ? `+${item.amount}` : item.amount} d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400 text-[11px] max-w-xs truncate">
                        {item.note || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};
