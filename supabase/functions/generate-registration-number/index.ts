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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user ID from the request
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Get the count of existing patients for this user
    const { count, error: countError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      throw countError
    }

    const patientCount = count || 0

    // Check if limit reached (1000 patients max)
    if (patientCount >= 1000) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Registration limit reached. Maximum 1000 patients allowed.',
          canRegister: false
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Generate next registration number (1-1000, cycling)
    const nextRegdNo = (patientCount % 1000) + 1
    const formattedRegdNo = nextRegdNo.toString().padStart(4, '0')

    // Check if this registration number already exists for this user
    const { data: existingPatient, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .eq('regd_no', formattedRegdNo)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError
    }

    // If registration number exists, find the next available one
    let finalRegdNo = formattedRegdNo
    if (existingPatient) {
      // Find next available registration number
      for (let i = 1; i <= 1000; i++) {
        const testRegdNo = i.toString().padStart(4, '0')
        const { data: testPatient, error: testError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', userId)
          .eq('regd_no', testRegdNo)
          .single()

        if (testError && testError.code === 'PGRST116') {
          // This registration number is available
          finalRegdNo = testRegdNo
          break
        } else if (testError) {
          throw testError
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        registrationNumber: finalRegdNo,
        canRegister: true,
        currentCount: patientCount,
        maxLimit: 1000
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error generating registration number:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        canRegister: false
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