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
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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
  revoked: boolean;
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

interface DelegationRow {
  id: string;
  grantor_id: string;
  grantee_id: string;
  resource_type: string | null;
  resource_id: string | null;
  reason: string;
  valid_from: string;
  valid_until: string;
  revoked: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
  grantor?: { email: string } | null;
  grantee?: { email: string } | null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
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
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

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
      .from("permission_delegations")
      .select(`
        id,
        grantor_id,
        grantee_id,
        resource_type,
        resource_id,
        reason,
        valid_from,
        valid_until,
        revoked,
        revoked_at,
        revoked_by,
        created_at,
        grantor:users!grantor_id(email),
        grantee:users!grantee_id(email)
      `)
      .eq("grantor_id", user.id);

    let receivedQuery = supabaseAdmin
      .from("permission_delegations")
      .select(`
        id,
        grantor_id,
        grantee_id,
        resource_type,
        resource_id,
        reason,
        valid_from,
        valid_until,
        revoked,
        revoked_at,
        revoked_by,
        created_at,
        grantor:users!grantor_id(email),
        grantee:users!grantee_id(email)
      `)
      .eq("grantee_id", user.id);

    // Apply active filter
    if (activeOnly) {
      const now = new Date().toISOString();
      grantedQuery = grantedQuery.eq("revoked", false).gte("valid_until", now);
      receivedQuery = receivedQuery.eq("revoked", false).gte("valid_until", now);
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
    let grantedRows: DelegationRow[] = [];
    let receivedRows: DelegationRow[] = [];

    if (type === "granted" || type === "all") {
      let { data, error } = await grantedQuery;
      // Staging currently points these FKs at auth.users, while the response
      // contract requires public.users emails. Keep the required public.users
      // embed as the canonical query and temporarily fall back to base columns
      // when PostgREST cannot discover that relationship.
      if (error?.code === "PGRST200") {
        ({ data, error } = await grantedQuery.select(`
          id,
          grantor_id,
          grantee_id,
          resource_type,
          resource_id,
          reason,
          valid_from,
          valid_until,
          revoked,
          revoked_at,
          revoked_by,
          created_at
        `));
      }
      if (error) {
        // Diagnostics stay server-side. The caller never receives the PostgREST
        // object, the relation name, or the SQLSTATE — only a bilingual envelope.
        console.error("Granted delegations query error:", error);
        return new Response(
          JSON.stringify({
            error: {
              code: "QUERY_FAILED",
              message_en: "Failed to load delegations",
              message_ar: "فشل في تحميل التفويضات",
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (data) {
        grantedRows = data as DelegationRow[];
      }
    }

    if (type === "received" || type === "all") {
      let { data, error } = await receivedQuery;
      if (error?.code === "PGRST200") {
        ({ data, error } = await receivedQuery.select(`
          id,
          grantor_id,
          grantee_id,
          resource_type,
          resource_id,
          reason,
          valid_from,
          valid_until,
          revoked,
          revoked_at,
          revoked_by,
          created_at
        `));
      }
      if (error) {
        // Diagnostics stay server-side. The caller never receives the PostgREST
        // object, the relation name, or the SQLSTATE — only a bilingual envelope.
        console.error("Received delegations query error:", error);
        return new Response(
          JSON.stringify({
            error: {
              code: "QUERY_FAILED",
              message_en: "Failed to load delegations",
              message_ar: "فشل في تحميل التفويضات",
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (data) {
        receivedRows = data as DelegationRow[];
      }
    }

    // Resolve only emails absent from the embed. This compatibility path can be
    // removed once the live FKs expose public.users relationships to PostgREST.
    const emailByUserId = new Map<string, string>();
    const userIds = [
      ...new Set(
        [...grantedRows, ...receivedRows].flatMap((d) => [
          ...(d.grantor?.email ? [] : [d.grantor_id]),
          ...(d.grantee?.email ? [] : [d.grantee_id]),
        ]),
      ),
    ];
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .in("id", userIds);
      if (usersError) {
        console.error("Delegation user lookup error:", usersError);
      } else {
        for (const delegationUser of users ?? []) {
          emailByUserId.set(delegationUser.id, delegationUser.email);
        }
      }
    }

    const toDelegation = (d: DelegationRow): Delegation => {
      const validUntil = new Date(d.valid_until);
      const now = new Date();
      const expiresInMs = validUntil.getTime() - now.getTime();

      return {
        id: d.id,
        grantor_id: d.grantor_id,
        grantor_email:
          d.grantor?.email || emailByUserId.get(d.grantor_id) || "",
        grantee_id: d.grantee_id,
        grantee_email:
          d.grantee?.email || emailByUserId.get(d.grantee_id) || "",
        source: "permission",
        resource_type: d.resource_type,
        resource_id: d.resource_id,
        reason: d.reason,
        revoked: d.revoked,
        is_active:
          !d.revoked && now >= new Date(d.valid_from) && now <= validUntil,
        valid_from: d.valid_from,
        valid_until: d.valid_until,
        revoked_at: d.revoked_at,
        revoked_by: d.revoked_by,
        expires_in_days: Math.ceil(expiresInMs / (1000 * 60 * 60 * 24)),
        created_at: d.created_at,
      };
    };

    const granted = grantedRows.map(toDelegation);
    const received = receivedRows.map(toDelegation);

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
