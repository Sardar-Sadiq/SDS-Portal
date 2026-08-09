import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useStore } from '@/context/store-context';
import { supabase } from '@/lib/supabaseClient';
import { Download, AlertTriangle, ShieldCheck, Clock, Archive, FileSpreadsheet, XCircle, RefreshCw } from 'lucide-react';

const PURGE_GRACE_PERIOD_MINUTES = 30;

export const AdminReportsView = () => {
  const { currentUser, attendanceRecords, exportAttendanceExcel, showToast } = useStore();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal & purge states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hasVerifiedDownload, setHasVerifiedDownload] = useState(false);
  const [activePurgeRequest, setActivePurgeRequest] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Past archived purges
  const [archivedReports, setArchivedReports] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

  // Fetch purge requests from DB
  const fetchPurgeRequests = async () => {
    setLoadingArchives(true);
    try {
      const { data, error } = await supabase
        .from('attendance_purge_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch attendance_purge_requests:', error.message);
      } else if (data) {
        setArchivedReports(data);
        // Find if there's any active pending request
        const pending = data.find(p => p.status === 'pending');
        if (pending) {
          setActivePurgeRequest(pending);
        } else {
          setActivePurgeRequest(null);
        }
      }
    } catch (err) {
      console.error('Error querying purge requests:', err);
    } finally {
      setLoadingArchives(false);
    }
  };

  useEffect(() => {
    fetchPurgeRequests();
  }, []);

  // Countdown timer for active purge request
  useEffect(() => {
    if (!activePurgeRequest || activePurgeRequest.status !== 'pending') {
      setRemainingSeconds(0);
      return;
    }

    const scheduledTime = new Date(activePurgeRequest.scheduled_delete_at).getTime();

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((scheduledTime - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        fetchPurgeRequests();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePurgeRequest]);

  // Step 1: Export file & show verification dialog
  const handleStartExportFlow = () => {
    exportAttendanceExcel();
    setHasVerifiedDownload(false);
    setIsConfirmModalOpen(true);
  };

  // Step 2: Confirm purge schedule
  const handleConfirmPurgeSchedule = async () => {
    if (!hasVerifiedDownload) return;

    const scheduledDeleteAt = new Date(Date.now() + PURGE_GRACE_PERIOD_MINUTES * 60 * 1000).toISOString();
    const archivePath = `attendance-archives/${selectedYear}/month-${selectedMonth}-${selectedYear}.xlsx`;

    try {
      const { data, error } = await supabase
        .from('attendance_purge_requests')
        .insert([
          {
            report_month: Number(selectedMonth),
            report_year: Number(selectedYear),
            requested_by: currentUser?.auth_id || currentUser?.id,
            archive_path: archivePath,
            status: 'pending',
            scheduled_delete_at: scheduledDeleteAt,
          }
        ])
        .select()
        .single();

      if (error) {
        showToast({
          title: "Purge Schedule Failed",
          description: error.message,
          status: "error"
        });
      } else {
        setActivePurgeRequest(data);
        showToast({
          title: "Purge Scheduled",
          description: `Live attendance purge scheduled in ${PURGE_GRACE_PERIOD_MINUTES} minutes. You may cancel anytime before countdown ends.`,
          status: "info"
        });
        fetchPurgeRequests();
      }
    } catch (err) {
      console.error('Error inserting purge request:', err);
    } finally {
      setIsConfirmModalOpen(false);
    }
  };

  // Cancel pending purge
  const handleCancelPurge = async () => {
    if (!activePurgeRequest) return;

    try {
      const { error } = await supabase
        .from('attendance_purge_requests')
        .update({ status: 'cancelled' })
        .eq('id', activePurgeRequest.id);

      if (error) {
        showToast({
          title: "Cancel Failed",
          description: error.message,
          status: "error"
        });
      } else {
        showToast({
          title: "Purge Cancelled",
          description: "Scheduled live data purge has been cancelled safely. No records were deleted.",
          status: "success"
        });
        setActivePurgeRequest(null);
        fetchPurgeRequests();
      }
    } catch (err) {
      console.error('Error cancelling purge:', err);
    }
  };

  // Helper formatting for countdown mm:ss
  const formatCountdown = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Monthly Attendance Reports &amp; Data Purge
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Export monthly audit records, schedule automated live database purges, and access permanent archives
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs w-fit">
          Admin Data Lifecycle Mode
        </Badge>
      </div>

      {/* Active Pending Purge Alert Box */}
      {activePurgeRequest && activePurgeRequest.status === 'pending' && (
        <Card className="border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Live Data Purge Pending for {monthNames[activePurgeRequest.report_month - 1]} {activePurgeRequest.report_year}
                  </h4>
                  <Badge variant="warning" className="font-mono text-[10px]">
                    COUNTDOWN ACTIVE
                  </Badge>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  Live attendance records for this month will be permanently deleted in{' '}
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCountdown(remainingSeconds)}
                  </span>
                  . A verified permanent archive has been preserved.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelPurge}
              className="text-xs shrink-0 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Cancel Deletion
            </Button>
          </div>
        </Card>
      )}

      {/* Export & Archive Action Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Export &amp; Schedule Monthly Purge
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleStartExportFlow}
              className="w-full text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export &amp; Archive Monthly Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Archived Reports Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Archive className="w-4 h-4 text-neutral-500" /> Permanent Archived Monthly Reports
            </CardTitle>
            <CardDescription className="text-xs">
              Past purged months preserved permanently in storage buckets with signed re-download links
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPurgeRequests} className="text-xs gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-neutral-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-4 font-normal">Month / Year</th>
                  <th className="py-3 px-4 font-normal">Requested Date</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Rows Deleted</th>
                  <th className="py-3 px-4 font-normal">Archive Storage Path</th>
                  <th className="py-3 px-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {archivedReports.length > 0 ? (
                  archivedReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                        {monthNames[rep.report_month - 1]} {rep.report_year}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            rep.status === 'completed'
                              ? 'success'
                              : rep.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                          className="capitalize text-[10px]"
                        >
                          {rep.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-300">
                        {rep.rows_deleted ?? (rep.status === 'pending' ? 'Pending Purge' : '0')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-neutral-400 truncate max-w-xs">
                        {rep.archive_path}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportAttendanceExcel}
                          className="text-xs py-1"
                        >
                          Re-Download Report
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No archived purge reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog before Purge Request is Created */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Irreversible Data Purge Schedule"
        description="Verify downloaded report before initiating live database cleanup"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Permanent Live Data Removal Warning</span>
            </div>
            <p>
              This action will schedule permanent deletion of live check-in records for{' '}
              <strong>
                {monthNames[selectedMonth - 1]} {selectedYear}
              </strong>{' '}
              in <strong>30 minutes</strong>.
            </p>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="verify-check"
              checked={hasVerifiedDownload}
              onChange={(e) => setHasVerifiedDownload(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 dark:border-neutral-700 focus:ring-neutral-500"
            />
            <label htmlFor="verify-check" className="text-xs text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer">
              I have downloaded, opened, and verified the exported monthly report file (.csv / .xlsx).
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!hasVerifiedDownload}
              variant="destructive"
              onClick={handleConfirmPurgeSchedule}
            >
              Confirm &amp; Start 30-Min Countdown
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
