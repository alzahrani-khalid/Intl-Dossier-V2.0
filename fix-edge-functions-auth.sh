#!/bin/bash

# Fix auth pattern in all intake Edge Functions

cd "$(dirname "$0")/supabase/functions"

for func in intake-tickets-list intake-tickets-get intake-tickets-update intake-tickets-triage intake-tickets-assign intake-tickets-convert intake-tickets-duplicates intake-tickets-merge intake-tickets-attachments; do
  echo "Fixing $func..."
  
  # Use Perl for multi-line replacement
  perl -i -0pe 's/\/\/ Get auth token\s+const authHeader = req\.headers\.get\("Authorization"\);.*?\/\/ Get current user\s+const \{\s+data: \{ user \},\s+error: userError,\s+\} = await supabaseClient\.auth\.getUser\(\);/\/\/ Get auth token\n    const authHeader = req.headers.get("Authorization");\n    if (!authHeader) {\n      return new Response(\n        JSON.stringify({ error: "Unauthorized", message: "Missing authorization header" }),\n        {\n          status: 401,\n          headers: { ...corsHeaders, "Content-Type": "application\/json" },\n        }\n      );\n    }\n\n    \/\/ Extract JWT from Bearer token\n    const jwt = authHeader.replace("Bearer ", "");\n\n    \/\/ Create Supabase client with service role key for database operations\n    const supabaseClient = createClient(\n      Deno.env.get("SUPABASE_URL") ?? "",\n      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""\n    );\n\n    \/\/ Validate the user'"'"'s JWT token\n    const {\n      data: { user },\n      error: userError,\n    } = await supabaseClient.auth.getUser(jwt);/s' "$func/index.ts"
  
done

echo "✅ All Edge Functions fixed!"
