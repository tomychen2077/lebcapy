import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the date 6 days ago
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
    const cutoffDate = sixDaysAgo.toISOString()

    console.log(`Deleting reports completed before: ${cutoffDate}`)

    // Get completed reports older than 6 days
    const { data: reportsToDelete, error: fetchError } = await supabase
      .from('reports')
      .select('id, pdf_url, user_id')
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${reportsToDelete?.length || 0} reports to delete`)

    const results = []
    let deletedCount = 0
    let errorCount = 0

    // Process each report
    for (const report of reportsToDelete || []) {
      try {
        // Delete the PDF file from storage if it exists
        if (report.pdf_url) {
          // Extract the file path from the URL
          const url = new URL(report.pdf_url)
          const pathParts = url.pathname.split('/')
          const bucketIndex = pathParts.indexOf('reports')
          
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/')
            
            const { error: storageError } = await supabase.storage
              .from('reports')
              .remove([filePath])

            if (storageError) {
              console.error(`Error deleting file for report ${report.id}:`, storageError)
            } else {
              console.log(`Deleted file: ${filePath}`)
            }
          }
        }

        // Delete the report record from the database
        const { error: deleteError } = await supabase
          .from('reports')
          .delete()
          .eq('id', report.id)

        if (deleteError) {
          console.error(`Error deleting report ${report.id}:`, deleteError)
          errorCount++
          results.push({ 
            id: report.id, 
            success: false, 
            error: deleteError.message 
          })
        } else {
          console.log(`Deleted report: ${report.id}`)
          deletedCount++
          results.push({ 
            id: report.id, 
            success: true 
          })
        }

      } catch (err) {
        console.error(`Error processing report ${report.id}:`, err)
        errorCount++
        results.push({ 
          id: report.id, 
          success: false, 
          error: err.message 
        })
      }
    }

    const response = {
      success: true,
      message: `Auto-deletion completed`,
      stats: {
        totalFound: reportsToDelete?.length || 0,
        deleted: deletedCount,
        errors: errorCount,
        cutoffDate
      },
      details: results
    }

    console.log('Auto-deletion summary:', response.stats)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in auto-delete function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Failed to execute auto-deletion'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})