// Check for required bindings and environment variables
const requiredBindings = ['DATE_NIGHT_PREFERENCES'];
const requiredEnvVars = ['CLOUDFLARE_SCOPED_TOKEN'];

let missingResources = [];

function checkRequiredResources() {
  requiredBindings.forEach(binding => {
    if (typeof self[binding] === 'undefined') {
      missingResources.push(`KV namespace: ${binding}`);
    }
  });

  requiredEnvVars.forEach(envVar => {
    if (typeof self[envVar] === 'undefined') {
      missingResources.push(`Environment variable: ${envVar}`);
    }
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Check for missing resources
  checkRequiredResources();
  if (missingResources.length > 0) {
    return new Response(JSON.stringify({
      error: 'Missing required resources',
      details: missingResources
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(request.url)
  const path = url.pathname

  try {
    if (path === '/submit-preferences' && request.method === 'POST') {
      return handleSubmitPreferences(request, corsHeaders)
    } else if (path === '/generate-plan' && request.method === 'POST') {
      return handleGeneratePlan(request, corsHeaders)
    } else {
      return new Response('Not Found', { status: 404, headers: corsHeaders })
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleSubmitPreferences(request, corsHeaders) {
  const { preferences } = await request.json()
  const id = crypto.randomUUID()
  
  try {
    await DATE_NIGHT_PREFERENCES.put(id, JSON.stringify(preferences))
    return new Response(JSON.stringify({ id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error storing preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to store preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGeneratePlan(request, corsHeaders) {
  const { id, partnerPreferences } = await request.json()
  
  try {
    const userPreferences = await DATE_NIGHT_PREFERENCES.get(id)
    if (!userPreferences) {
      return new Response(JSON.stringify({ error: 'Preferences not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const combinedPreferences = {
      user1: JSON.parse(userPreferences),
      user2: partnerPreferences
    }

    const plan = await generateDatePlan(combinedPreferences)

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error generating plan:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate plan', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function generateDatePlan(preferences) {
  const API_ENDPOINT = 'https://gateway.ai.cloudflare.com/v1/eca95c4515a39540cafc79d7b2561a25/date-night/workers-ai/@cf/meta/llama-3.1-70b-instruct-preview'
  
  const systemPrompt = `You are a date night planner helping two romantic partners based on both of their preferences. First, give the date night a title based on the plan. Second, write an itinerary compromising on their preferences. If one partner says "Pass" for physical intimacy, do not recommend any physical intimacy at all regardless of the other partner submission. Make sure to consider both partners' preferences and find a balance between them.`

  const userPrompt = `Here are the preferences for two partners:
  
  Partner 1: ${JSON.stringify(preferences.user1)}
  Partner 2: ${JSON.stringify(preferences.user2)}
  
  Draft the date night plan.`

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_SCOPED_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`AI Gateway request failed with status ${response.status}`)
    }

    const result = await response.json()
    return result.result.response
  } catch (error) {
    console.error('Error calling AI Gateway:', error);
    throw new Error('Failed to generate date plan');
  }
}
