/**
 * Auth Step-Up Verification Endpoint
 * POST /auth/verify-step-up
 *
 * Purpose: Verify TOTP code for step-up MFA and record verification in audit logs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface VerifyStepUpRequest {
  totp_code: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid user session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: VerifyStepUpRequest = await req.json();
    const { totp_code } = body;

    if (!totp_code || totp_code.length !== 6) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid TOTP code format. Expected 6 digits.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify TOTP code with Supabase Auth
    // Note: This assumes the user has MFA enabled
    const { data: mfaData, error: mfaError } = await supabaseClient.auth.mfa.verify({
      factorId: user.id, // In production, get the actual factor ID from user metadata
      code: totp_code,
    });

    if (mfaError || !mfaData) {
      // Track failed attempt
      await recordAuditLog(supabaseClient, {
        userId: user.id,
        action: "mfa_verify_failed",
        mfaVerified: false,
        ipAddress: req.headers.get("X-Forwarded-For") || "unknown",
        userAgent: req.headers.get("User-Agent") || "unknown",
      });

      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Invalid TOTP code. Please try again.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record successful MFA verification in audit logs
    const recorded = await recordAuditLog(supabaseClient, {
      userId: user.id,
      action: "mfa_verify",
      mfaVerified: true,
      mfaMethod: "totp",
      ipAddress: req.headers.get("X-Forwarded-For") || "unknown",
      userAgent: req.headers.get("User-Agent") || "unknown",
    });

    if (!recorded) {
      console.warn("Failed to record MFA verification, but allowing operation");
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "MFA verification successful",
        valid_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error during step-up MFA verification:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred during verification",
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Record audit log entry
 */
async function recordAuditLog(
  supabaseClient: any,
  options: {
    userId: string;
    action: string;
    mfaVerified: boolean;
    mfaMethod?: string;
    ipAddress: string;
    userAgent: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from("audit_logs").insert({
      entity_type: "user",
      entity_id: options.userId,
      action: options.action,
      user_id: options.userId,
      user_role: "user",
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      required_mfa: true,
      mfa_verified: options.mfaVerified,
      mfa_method: options.mfaMethod,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to record audit log:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception recording audit log:", error);
    return false;
  }
}