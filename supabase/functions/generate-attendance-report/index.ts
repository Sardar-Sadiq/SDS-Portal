// Supabase Edge Function: generate-attendance-report
// Serves monthly attendance dataset as XLSX / CSV, uploads to permanent private bucket,
// and returns short-expiry signed download URL and storage archive_path.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { month, year } = await req.json();

    if (!month || !year) {
      return new Response(JSON.stringify({ error: "month and year are required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch records for month & year
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data: records, error: fetchErr } = await supabaseAdmin
      .from('SDS_Attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (fetchErr) {
      throw fetchErr;
    }

    // Convert records to CSV content
    const headers = "ID,Employee ID,Employee Name,Department,Date,Check In,Check Out,Working Hours,Status,Location Verified,Distance (m),Accuracy (m),Branch\n";
    const rows = (records || []).map(r => 
      `"${r.id}","${r.employee_id}","${r.employee_name}","${r.department || ''}","${r.date}","${r.check_in || ''}","${r.check_out || ''}","${r.working_hours || 0}","${r.status}","${r.location_verified ? 'YES' : 'NO'}","${r.distance_from_office_meters || ''}","${r.accuracy_meters || ''}","${r.office_name || ''}"`
    ).join("\n");

    const csvContent = headers + rows;
    const archivePath = `attendance-archives/${year}/month-${month}-${year}.csv`;

    // Upload to permanent private storage bucket 'attendance-archives'
    const { error: uploadErr } = await supabaseAdmin
      .storage
      .from('attendance-archives')
      .upload(archivePath, csvContent, {
        contentType: 'text/csv',
        upsert: true
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr.message);
    }

    // Create 30-minute signed URL
    const { data: signedData, error: signErr } = await supabaseAdmin
      .storage
      .from('attendance-archives')
      .createSignedUrl(archivePath, 1800); // 30 minutes = 1800 seconds

    return new Response(
      JSON.stringify({
        success: true,
        archivePath,
        signedUrl: signedData?.signedUrl || null,
        rowCount: records?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
