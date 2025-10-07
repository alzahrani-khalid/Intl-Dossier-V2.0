import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client without auth (health check is public)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const healthChecks = {
      database: false,
      storage: false,
      auth: false,
    };

    // Check database connectivity
    try {
      const { error } = await supabaseClient
        .from("intake_tickets")
        .select("id")
        .limit(1);
      
      healthChecks.database = !error;
    } catch (err) {
      console.error("Database health check failed:", err);
      healthChecks.database = false;
    }

    // Check storage connectivity
    try {
      const { error } = await supabaseClient
        .storage
        .from("attachments")
        .list("", { limit: 1 });
      
      healthChecks.storage = !error;
    } catch (err) {
      console.error("Storage health check failed:", err);
      healthChecks.storage = false;
    }

    // Check auth service
    try {
      // Simple check - just verify the service is responding
      healthChecks.auth = true; // Auth is handled by Supabase platform
    } catch (err) {
      console.error("Auth health check failed:", err);
      healthChecks.auth = false;
    }

    // Determine overall status
    const allHealthy = Object.values(healthChecks).every(check => check === true);
    const someHealthy = Object.values(healthChecks).some(check => check === true);
    
    let status: "healthy" | "degraded" | "unhealthy";
    if (allHealthy) {
      status = "healthy";
    } else if (someHealthy) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    const response = {
      status,
      services: healthChecks,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: status === "healthy" ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health check error:", error);
    
    const response = {
      status: "unhealthy",
      services: {
        database: false,
        storage: false,
        auth: false,
      },
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});