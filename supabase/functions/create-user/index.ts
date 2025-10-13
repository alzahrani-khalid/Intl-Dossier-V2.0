/**
 * Edge Function: create-user
 * Feature: 019-user-management-access
 * Task: T021
 *
 * Creates a new user account with initial role assignment.
 * Sends activation email to user.
 *
 * Authorization: Admin role required
 * Rate Limit: 10 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/user-lifecycle.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  withRateLimit,
  ADMIN_RATE_LIMIT,
} from "../_shared/rate-limiter.ts";
import { createLogger } from "../_shared/logger.ts";

interface CreateUserRequest {
  email: string;
  full_name: string;
  username: string;
  role: "admin" | "editor" | "viewer";
  user_type?: "employee" | "guest";
  expires_at?: string;
  allowed_resources?: string[];
}

interface CreateUserResponse {
  success: boolean;
  user_id: string;
  activation_sent: boolean;
  activation_expires_at: string;
}

// Validation helpers
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
const USERNAME_REGEX = /^[a-z0-9_-]{3,50}$/;

function validateEmail(email: string): string | null {
  if (!email) {
    return "Email is required";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Invalid email format";
  }
  return null;
}

function validateUsername(username: string): string | null {
  if (!username) {
    return "Username is required";
  }
  if (!USERNAME_REGEX.test(username)) {
    return "Username must be 3-50 characters, lowercase alphanumeric with underscore/hyphen";
  }
  return null;
}

function validateFullName(fullName: string): string | null {
  if (!fullName) {
    return "Full name is required";
  }
  if (fullName.length < 2 || fullName.length > 100) {
    return "Full name must be 2-100 characters";
  }
  return null;
}

function validateRole(role: string): string | null {
  if (!role) {
    return "Role is required";
  }
  if (!["admin", "editor", "viewer"].includes(role)) {
    return "Role must be one of: admin, editor, viewer";
  }
  return null;
}

function validateGuestAccount(
  userType: string,
  expiresAt?: string,
  allowedResources?: string[]
): string | null {
  if (userType === "guest") {
    if (!expiresAt) {
      return "Guest accounts must have expires_at set";
    }
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      return "Invalid expires_at date format";
    }
    if (expiryDate <= new Date()) {
      return "Guest account expiration must be in the future";
    }
    if (!allowedResources || allowedResources.length === 0) {
      return "Guest accounts must have at least one allowed resource";
    }
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apply rate limiting (10 req/min for admin actions)
  const rateLimitResponse = await withRateLimit(
    req,
    ADMIN_RATE_LIMIT,
    corsHeaders
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Initialize logger
    const logger = createLogger("create-user", req);
    logger.info("Processing user creation request");

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn("Missing authorization header");

      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create regular client to verify requester
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user (requester)
    const {
      data: { user: requester },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !requester) {
      return new Response(
        JSON.stringify({
          error: "Invalid user session",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if requester has admin role
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from("auth.users")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (requesterError || !requesterData || requesterData.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions (admin role required)",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body: CreateUserRequest = await req.json();

    // Validation
    const validationErrors: string[] = [];

    const emailError = validateEmail(body.email);
    if (emailError) validationErrors.push(emailError);

    const usernameError = validateUsername(body.username);
    if (usernameError) validationErrors.push(usernameError);

    const fullNameError = validateFullName(body.full_name);
    if (fullNameError) validationErrors.push(fullNameError);

    const roleError = validateRole(body.role);
    if (roleError) validationErrors.push(roleError);

    const userType = body.user_type || "employee";
    const guestError = validateGuestAccount(
      userType,
      body.expires_at,
      body.allowed_resources
    );
    if (guestError) validationErrors.push(guestError);

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", body.email.toLowerCase())
      .maybeSingle();

    if (emailCheckError) {
      console.error("Email check error:", emailCheckError);
    }

    if (existingEmail) {
      return new Response(
        JSON.stringify({
          error: "Email already exists",
          code: "DUPLICATE_EMAIL",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if username already exists
    const { data: existingUsername, error: usernameCheckError } =
      await supabaseAdmin
        .from("auth.users")
        .select("id")
        .eq("username", body.username.toLowerCase())
        .maybeSingle();

    if (usernameCheckError) {
      console.error("Username check error:", usernameCheckError);
    }

    if (existingUsername) {
      return new Response(
        JSON.stringify({
          error: "Username already exists",
          code: "DUPLICATE_USERNAME",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate temporary password (user will set their own during activation)
    const tempPassword = crypto.randomUUID() + crypto.randomUUID();

    // Create user with Supabase Auth Admin API
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email.toLowerCase(),
        password: tempPassword,
        email_confirm: false, // User must activate via token
        user_metadata: {
          username: body.username.toLowerCase(),
          full_name: body.full_name,
          role: body.role,
          user_type: userType,
          status: "inactive", // Pending activation
          preferences: {
            language: "en",
            timezone: "UTC",
            notifications_enabled: true,
            email_notifications: true,
          },
          mfa_enabled: false,
          allowed_resources: body.allowed_resources || [],
          expires_at: body.expires_at || null,
          created_by: requester.id,
        },
      });

    if (createError || !newUser.user) {
      console.error("User creation error:", createError);
      return new Response(
        JSON.stringify({
          error: "Failed to create user",
          code: "USER_CREATION_FAILED",
          details: createError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update auth.users table with extended fields
    const { error: updateError } = await supabaseAdmin
      .from("auth.users")
      .update({
        username: body.username.toLowerCase(),
        full_name: body.full_name,
        role: body.role,
        user_type: userType,
        status: "inactive",
        preferences: {
          language: "en",
          timezone: "UTC",
          notifications_enabled: true,
          email_notifications: true,
        },
        mfa_enabled: false,
        allowed_resources: body.allowed_resources || [],
        expires_at: body.expires_at || null,
        created_by: requester.id,
      })
      .eq("id", newUser.user.id);

    if (updateError) {
      console.error("User profile update error:", updateError);
      // Non-critical - user was created, this is just profile data
    }

    // Generate activation token (expires in 48 hours)
    const activationExpiresAt = new Date();
    activationExpiresAt.setHours(activationExpiresAt.getHours() + 48);

    const { data: tokenData, error: tokenError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: body.email.toLowerCase(),
        options: {
          redirectTo: `${Deno.env.get("APP_URL") || "https://intl-dossier.stats.gov.sa"}/activate`,
        },
      });

    if (tokenError || !tokenData) {
      console.error("Activation token generation error:", tokenError);
      // User is created but can't be activated - log for manual intervention
      await supabaseAdmin.from("audit_logs").insert({
        user_id: requester.id,
        target_user_id: newUser.user.id,
        event_type: "user_created",
        resource_type: "user",
        resource_id: newUser.user.id,
        action: "create",
        changes: {
          after: {
            email: body.email,
            username: body.username,
            role: body.role,
            user_type: userType,
          },
        },
        metadata: {
          activation_failed: true,
          token_error: tokenError?.message,
        },
        ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      return new Response(
        JSON.stringify({
          success: true,
          user_id: newUser.user.id,
          activation_sent: false,
          activation_expires_at: activationExpiresAt.toISOString(),
          warning: "User created but activation email failed to send",
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send activation email (in production, this would use email service)
    // For now, log the activation link
    console.log("=== ACTIVATION EMAIL ===");
    console.log(`To: ${body.email}`);
    console.log(`Full Name: ${body.full_name}`);
    console.log(`Activation Link: ${tokenData.properties.action_link}`);
    console.log(`Expires: ${activationExpiresAt.toISOString()}`);
    console.log("========================");

    // Log to audit_logs
    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: requester.id,
        target_user_id: newUser.user.id,
        event_type: "user_created",
        resource_type: "user",
        resource_id: newUser.user.id,
        action: "create",
        changes: {
          after: {
            email: body.email,
            username: body.username,
            full_name: body.full_name,
            role: body.role,
            user_type: userType,
            status: "inactive",
          },
        },
        metadata: {
          source: "user_management",
          activation_sent: true,
        },
        ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

    if (auditError) {
      console.error("Audit log error:", auditError);
      // Non-critical - user was created successfully
    }

    // Create notification for the admin who created the user
    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: requester.id,
        type: "user_created",
        message: `User account created for ${body.full_name} (${body.email})`,
        metadata: {
          user_id: newUser.user.id,
          email: body.email,
          role: body.role,
        },
        is_read: false,
      });

    if (notificationError) {
      console.error("Notification error:", notificationError);
      // Non-critical
    }

    const response: CreateUserResponse = {
      success: true,
      user_id: newUser.user.id,
      activation_sent: true,
      activation_expires_at: activationExpiresAt.toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
