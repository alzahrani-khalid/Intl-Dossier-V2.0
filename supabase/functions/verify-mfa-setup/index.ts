// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.1.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyMFARequest {
  userId: string;
  totpCode: string;
}

interface VerifyMFAResponse {
  success: boolean;
  mfaEnabled?: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { userId, totpCode }: VerifyMFARequest = await req.json();

    // Validate user can verify MFA for themselves or is admin
    const { data: currentUser } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userId !== user.id && currentUser?.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user MFA setup details
    const { data: targetUser } = await supabaseClient
      .from("users")
      .select("preferences, mfa_enabled")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if MFA setup is pending
    const preferences = targetUser.preferences as any;
    if (!preferences?.mfa_setup_pending || !preferences?.mfa_secret) {
      return new Response(
        JSON.stringify({ success: false, error: "MFA setup not initiated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify TOTP code
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(preferences.mfa_secret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const isValid = totp.validate({ token: totpCode, window: 1 }); // Allow 1 period window

    if (isValid === null) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid TOTP code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enable MFA for user
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({
        mfa_enabled: true,
        preferences: {
          ...preferences,
          mfa_setup_pending: false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to enable MFA:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to enable MFA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit trail
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: "mfa_enabled",
      resource_type: "user",
      resource_id: userId,
      changes: {
        mfa_enabled: true,
      },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    const response: VerifyMFAResponse = {
      success: true,
      mfaEnabled: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("MFA verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
