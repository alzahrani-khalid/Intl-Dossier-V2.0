import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface AIHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    embedding_model: boolean;
    classification_model: boolean;
    vector_store: boolean;
  };
  fallback_active: boolean;
  last_success: string | null;
  timestamp: string;
}

/**
 * AI Health Check Endpoint
 *
 * Checks the health of AI services including:
 * - AnythingLLM embedding model
 * - AnythingLLM classification model
 * - pgvector extension
 *
 * Implements fallback detection based on last successful AI operation.
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Initialize health check results
    const services = {
      embedding_model: false,
      classification_model: false,
      vector_store: false,
    };

    let lastSuccess: string | null = null;
    let fallbackActive = false;

    // Check AnythingLLM service availability
    const anythingllmUrl = Deno.env.get("ANYTHINGLLM_API_URL");
    const anythingllmKey = Deno.env.get("ANYTHINGLLM_API_KEY");

    if (!anythingllmUrl || !anythingllmKey) {
      console.error("AnythingLLM configuration missing");
      return new Response(
        JSON.stringify({
          status: "unhealthy",
          services,
          fallback_active: true,
          last_success: null,
          timestamp: new Date().toISOString(),
          error: "AnythingLLM not configured",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check embedding model (timeout: 5 seconds)
    try {
      const embeddingController = new AbortController();
      const embeddingTimeout = setTimeout(() => embeddingController.abort(), 5000);

      const embeddingResponse = await fetch(`${anythingllmUrl}/api/v1/embedding/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${anythingllmKey}`,
          "Content-Type": "application/json",
        },
        signal: embeddingController.signal,
      });

      clearTimeout(embeddingTimeout);
      services.embedding_model = embeddingResponse.ok;

      if (embeddingResponse.ok) {
        lastSuccess = new Date().toISOString();
      }
    } catch (error) {
      console.error("Embedding model check failed:", error);
      services.embedding_model = false;
    }

    // Check classification model (timeout: 5 seconds)
    try {
      const classificationController = new AbortController();
      const classificationTimeout = setTimeout(() => classificationController.abort(), 5000);

      const classificationResponse = await fetch(`${anythingllmUrl}/api/v1/chat/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${anythingllmKey}`,
          "Content-Type": "application/json",
        },
        signal: classificationController.signal,
      });

      clearTimeout(classificationTimeout);
      services.classification_model = classificationResponse.ok;

      if (classificationResponse.ok && !lastSuccess) {
        lastSuccess = new Date().toISOString();
      }
    } catch (error) {
      console.error("Classification model check failed:", error);
      services.classification_model = false;
    }

    // Check pgvector extension
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase configuration missing");
      }

      const { createClient } = await import("jsr:@supabase/supabase-js@2");
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Test pgvector by checking if extension is installed
      const { data, error } = await supabase
        .rpc("check_pgvector_health", {}, { count: "exact" })
        .select();

      if (error) {
        // If the RPC doesn't exist, try a simple query
        const { error: queryError } = await supabase
          .from("ai_embeddings")
          .select("id")
          .limit(1);

        services.vector_store = !queryError;
      } else {
        services.vector_store = true;
      }

      if (services.vector_store && !lastSuccess) {
        lastSuccess = new Date().toISOString();
      }
    } catch (error) {
      console.error("Vector store check failed:", error);
      services.vector_store = false;
    }

    // Check for cached last success time from metadata
    if (!lastSuccess) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (supabaseUrl && supabaseServiceKey) {
          const { createClient } = await import("jsr:@supabase/supabase-js@2");
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const { data } = await supabase
            .from("analysis_metadata")
            .select("created_at")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (data?.created_at) {
            lastSuccess = data.created_at;

            // Check if last success was more than 24 hours ago
            const lastSuccessTime = new Date(lastSuccess).getTime();
            const now = Date.now();
            const hoursSinceSuccess = (now - lastSuccessTime) / (1000 * 60 * 60);

            fallbackActive = hoursSinceSuccess > 24;
          }
        }
      } catch (error) {
        console.error("Failed to check last success time:", error);
      }
    }

    // Determine overall status
    let status: "healthy" | "degraded" | "unhealthy";

    if (services.embedding_model && services.classification_model && services.vector_store) {
      status = "healthy";
      fallbackActive = false;
    } else if (services.vector_store || lastSuccess) {
      status = "degraded";
      fallbackActive = true;
    } else {
      status = "unhealthy";
      fallbackActive = true;
    }

    const response: AIHealthResponse = {
      status,
      services,
      fallback_active: fallbackActive,
      last_success: lastSuccess,
      timestamp: new Date().toISOString(),
    };

    const elapsedTime = Date.now() - startTime;
    console.log(`AI health check completed in ${elapsedTime}ms - Status: ${status}`);

    return new Response(
      JSON.stringify(response),
      {
        status: status === "unhealthy" ? 503 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI health check error:", error);

    return new Response(
      JSON.stringify({
        status: "unhealthy",
        services: {
          embedding_model: false,
          classification_model: false,
          vector_store: false,
        },
        fallback_active: true,
        last_success: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});