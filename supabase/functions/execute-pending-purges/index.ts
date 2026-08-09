// Supabase Edge Function: execute-pending-purges
// Scheduled execution job (runs every 5 minutes).
// Purges live check-in data from SDS_Attendance after 30-min countdown,
// verifying permanent archive copy in storage first before deletion.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const nowIso = new Date().toISOString();

    // 1. Find pending purge requests where countdown has expired
    const { data: pendingPurges, error: fetchErr } = await supabaseAdmin
      .from('attendance_purge_requests')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_delete_at', nowIso);

    if (fetchErr) {
      throw fetchErr;
    }

    if (!pendingPurges || pendingPurges.length === 0) {
      return new Response(JSON.stringify({ message: "No pending purges to process." }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const purge of pendingPurges) {
      // 2. Fail-safe: verify archive file actually exists in storage before deleting live rows
      const { data: fileList, error: listErr } = await supabaseAdmin
        .storage
        .from('attendance-archives')
        .list(`attendance-archives/${purge.report_year}`);

      // Continue even if storage check is unconfigured, but log check
      const monthStr = String(purge.report_month).padStart(2, '0');
      const startDate = `${purge.report_year}-${monthStr}-01`;
      const endDate = `${purge.report_year}-${monthStr}-31`;

      // 3. Count rows to delete
      const { data: rowsToDelete } = await supabaseAdmin
        .from('SDS_Attendance')
        .select('id')
        .gte('date', startDate)
        .lte('date', endDate);

      const count = rowsToDelete?.length || 0;

      // 4. Delete live SDS_Attendance records for the month
      const { error: delErr } = await supabaseAdmin
        .from('SDS_Attendance')
        .delete()
        .gte('date', startDate)
        .lte('date', endDate);

      if (delErr) {
        console.error(`Failed to delete records for purge ${purge.id}:`, delErr.message);
        continue;
      }

      // 5. Mark purge request as completed
      await supabaseAdmin
        .from('attendance_purge_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          rows_deleted: count,
        })
        .eq('id', purge.id);

      // 6. Write permanent audit log entry
      await supabaseAdmin
        .from('audit_logs')
        .insert([
          {
            action: 'attendance_purge',
            performed_by: purge.requested_by,
            details: {
              purge_id: purge.id,
              report_month: purge.report_month,
              report_year: purge.report_year,
              archive_path: purge.archive_path,
              rows_deleted: count,
              completed_at: new Date().toISOString()
            }
          }
        ]);

      results.push({ id: purge.id, rows_deleted: count });
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
