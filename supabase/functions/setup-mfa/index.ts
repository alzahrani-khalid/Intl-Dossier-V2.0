// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.1.4";
import { QRCode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupMFARequest {
  userId: string;
}

interface SetupMFAResponse {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  error?: string;
}

/**
 * Generate cryptographically secure random backup codes
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);

    // Convert to 8-digit code
    const code = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 8)
      .toUpperCase();

    codes.push(code);
  }

  return codes;
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(otpauthUrl: string): Promise<string> {
  const qr = new QRCode();
  const qrData = await qr.encode(otpauthUrl);
  return qrData;
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
    const { userId }: SetupMFARequest = await req.json();

    // Validate user can setup MFA for themselves or is admin
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

    // Get user details for TOTP setup
    const { data: targetUser } = await supabaseClient
      .from("users")
      .select("email, username, mfa_enabled")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if MFA is already enabled
    if (targetUser.mfa_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "MFA already enabled for this user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: "Intl-Dossier",
      label: targetUser.email || targetUser.username,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;

    // Generate QR code
    const otpauthUrl = totp.toString();
    const qrCodeUrl = await generateQRCode(otpauthUrl);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Hash backup codes before storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async (code) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(code);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      })
    );

    // Store MFA secret and backup codes in user preferences
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({
        preferences: {
          mfa_secret: secret,
          mfa_backup_codes: hashedBackupCodes,
          mfa_setup_pending: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to store MFA setup:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to setup MFA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit trail
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: "mfa_setup_initiated",
      resource_type: "user",
      resource_id: userId,
      changes: {
        mfa_setup_pending: true,
      },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    const response: SetupMFAResponse = {
      success: true,
      secret,
      qrCodeUrl,
      backupCodes, // Return plain codes to user (one-time display)
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
