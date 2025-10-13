/**
 * Edge Function: my-delegations
 * Feature: 019-user-management-access
 * Task: T051
 *
 * Retrieves delegations where user is grantor (granted) or grantee (received).
 * Supports filtering by type, active status, and expiration timeframe.
 *
 * Authorization: Authenticated user
 * Rate Limit: 60 requests/min per user
 *
 * @see specs/019-user-management-access/contracts/delegation.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface Delegation {
  id: string;
  grantor_id: string;
  grantor_email: string;
  grantee_id: string;
  grantee_email: string;
  source: string;
  resource_type: string | null;
  resource_id: string | null;
  reason: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  revoked_at: string | null;
  revoked_by: string | null;
  expires_in_days: number;
  created_at: string;
}

interface MyDelegationsResponse {
  granted: Delegation[];
  received: Delegation[];
  total: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
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
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    // Create Supabase clients
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

    // Parse query parameters
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all"; // granted, received, all
    const activeOnly = url.searchParams.get("active_only") !== "false";
    const expiringWithinDays = url.searchParams.get("expiring_within_days");

    // Build base query
    let grantedQuery = supabaseAdmin
      .from("delegations")
      .select(`
        id,
        grantor_id,
        grantee_id,
        source,
        resource_type,
        resource_id,
        reason,
        is_active,
        valid_from,
        valid_until,
        revoked_at,
        revoked_by,
        created_at,
        grantor:auth.users!grantor_id(email),
        grantee:auth.users!grantee_id(email)
      `)
      .eq("grantor_id", user.id);

    let receivedQuery = supabaseAdmin
      .from("delegations")
      .select(`
        id,
        grantor_id,
        grantee_id,
        source,
        resource_type,
        resource_id,
        reason,
        is_active,
        valid_from,
        valid_until,
        revoked_at,
        revoked_by,
        created_at,
        grantor:auth.users!grantor_id(email),
        grantee:auth.users!grantee_id(email)
      `)
      .eq("grantee_id", user.id);

    // Apply active filter
    if (activeOnly) {
      grantedQuery = grantedQuery.eq("is_active", true);
      receivedQuery = receivedQuery.eq("is_active", true);
    }

    // Apply expiring filter
    if (expiringWithinDays) {
      const days = parseInt(expiringWithinDays, 10);
      if (!isNaN(days) && days > 0) {
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + days);
        grantedQuery = grantedQuery.lte("valid_until", expiryThreshold.toISOString());
        receivedQuery = receivedQuery.lte("valid_until", expiryThreshold.toISOString());
      }
    }

    // Order by expiration date (soonest first)
    grantedQuery = grantedQuery.order("valid_until", { ascending: true });
    receivedQuery = receivedQuery.order("valid_until", { ascending: true });

    // Execute queries based on type filter
    let granted: Delegation[] = [];
    let received: Delegation[] = [];

    if (type === "granted" || type === "all") {
      const { data, error } = await grantedQuery;
      if (error) {
        console.error("Granted delegations query error:", error);
      } else if (data) {
        granted = data.map((d: any) => {
          const validUntil = new Date(d.valid_until);
          const now = new Date();
          const expiresInMs = validUntil.getTime() - now.getTime();
          const expiresInDays = Math.ceil(expiresInMs / (1000 * 60 * 60 * 24));

          return {
            id: d.id,
            grantor_id: d.grantor_id,
            grantor_email: d.grantor?.email || "",
            grantee_id: d.grantee_id,
            grantee_email: d.grantee?.email || "",
            source: d.source,
            resource_type: d.resource_type,
            resource_id: d.resource_id,
            reason: d.reason,
            is_active: d.is_active,
            valid_from: d.valid_from,
            valid_until: d.valid_until,
            revoked_at: d.revoked_at,
            revoked_by: d.revoked_by,
            expires_in_days: expiresInDays,
            created_at: d.created_at,
          };
        });
      }
    }

    if (type === "received" || type === "all") {
      const { data, error } = await receivedQuery;
      if (error) {
        console.error("Received delegations query error:", error);
      } else if (data) {
        received = data.map((d: any) => {
          const validUntil = new Date(d.valid_until);
          const now = new Date();
          const expiresInMs = validUntil.getTime() - now.getTime();
          const expiresInDays = Math.ceil(expiresInMs / (1000 * 60 * 60 * 24));

          return {
            id: d.id,
            grantor_id: d.grantor_id,
            grantor_email: d.grantor?.email || "",
            grantee_id: d.grantee_id,
            grantee_email: d.grantee?.email || "",
            source: d.source,
            resource_type: d.resource_type,
            resource_id: d.resource_id,
            reason: d.reason,
            is_active: d.is_active,
            valid_from: d.valid_from,
            valid_until: d.valid_until,
            revoked_at: d.revoked_at,
            revoked_by: d.revoked_by,
            expires_in_days: expiresInDays,
            created_at: d.created_at,
          };
        });
      }
    }

    const response: MyDelegationsResponse = {
      granted,
      received,
      total: granted.length + received.length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
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
