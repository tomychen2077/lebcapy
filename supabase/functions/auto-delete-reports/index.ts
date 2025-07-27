// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  try {
    // Calculate the date 6 days ago
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
    const sixDaysAgoStr = sixDaysAgo.toISOString()

    // Get completed reports older than 6 days
    const { data: reportsToDelete, error: fetchError } = await supabase
      .from('reports')
      .select('id, pdf_url')
      .eq('status', 'completed')
      .lt('updated_at', sixDaysAgoStr)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${reportsToDelete?.length || 0} reports to delete`)

    // Process each report
    const results = []
    for (const report of reportsToDelete || []) {
      try {
        // Extract the path from the URL
        const urlParts = report.pdf_url.split('/')
        const bucketPath = urlParts.slice(urlParts.indexOf('reports')).join('/')

        // Delete the file from storage
        const { error: storageError } = await supabase
          .storage
          .from('reports')
          .remove([bucketPath])

        if (storageError) {
          console.error(`Error deleting file for report ${report.id}:`, storageError)
          results.push({ id: report.id, success: false, error: storageError.message })
          continue
        }

        // Delete the report record from the database
        const { error: deleteError } = await supabase
          .from('reports')
          .delete()
          .eq('id', report.id)

        if (deleteError) {
          console.error(`Error deleting report ${report.id}:`, deleteError)
          results.push({ id: report.id, success: false, error: deleteError.message })
          continue
        }

        results.push({ id: report.id, success: true })
      } catch (err) {
        console.error(`Error processing report ${report.id}:`, err)
        results.push({ id: report.id, success: false, error: err.message })
      }
    }

    return new Response(
      JSON.stringify({
        processed: reportsToDelete?.length || 0,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in auto-delete function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

/* To invoke locally:

1. Start Supabase locally: npx supabase start
2. Run the function: npx supabase functions serve auto-delete-reports
3. Invoke the function: curl -i --location --request POST 'http://localhost:54321/functions/v1/auto-delete-reports' \
   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
   --header 'Content-Type: application/json' \
   --data '{}'

*/