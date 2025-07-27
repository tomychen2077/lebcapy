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

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      throw userError
    }

    if (!user) {
      throw new Error('User not found')
    }

    // Calculate trial status
    let trialStatus = {
      hasStarted: false,
      isExpired: false,
      daysLeft: 0,
      trialEndDate: null,
      subscriptionStatus: user.subscription_status || 'trial',
      canAccessDashboard: false
    }

    if (user.trial_start_date) {
      const trialStart = new Date(user.trial_start_date)
      const trialEnd = new Date(trialStart)
      trialEnd.setMonth(trialEnd.getMonth() + 1) // 1 month trial
      
      const now = new Date()
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      trialStatus = {
        hasStarted: true,
        isExpired: now > trialEnd,
        daysLeft: Math.max(0, daysLeft),
        trialEndDate: trialEnd.toISOString(),
        subscriptionStatus: user.subscription_status || 'trial',
        canAccessDashboard: user.subscription_status === 'active' || (now <= trialEnd)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        trialStatus,
        user: {
          id: user.id,
          email: user.email,
          labName: user.lab_name,
          subscriptionStatus: user.subscription_status,
          subscriptionPlan: user.subscription_plan
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error checking trial status:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
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