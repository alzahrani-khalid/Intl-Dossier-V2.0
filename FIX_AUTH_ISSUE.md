# Edge Function Authentication Issue - Resolution Guide

## Problem Summary
Edge Functions return **401 Unauthorized** even though user authentication succeeds:
- ✅ User `kazahrani@stats.gov.sa` signs in successfully
- ✅ Access token is generated
- ✅ Authorization header is passed to Edge Functions
- ❌ Edge Functions' `auth.getUser()` fails to validate the token

## Root Cause
The JWT token generated during sign-in is not being accepted by the Edge Functions' Supabase client when calling `auth.getUser()`. This is typically caused by:

1. **Email Confirmation Required**: User account needs email verification
2. **Auth Configuration**: JWT verification settings mismatch
3. **Service Key vs User Token**: Edge Functions expecting different auth type

## Resolution Steps

### Option 1: Verify and Confirm User Email (RECOMMENDED)

```bash
# 1. Check if email confirmation is required in your Supabase project
# Go to: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/auth/users
# Look for user: kazahrani@stats.gov.sa
# Check if "Email Confirmed" is TRUE

# 2. If not confirmed, manually confirm via Supabase Dashboard:
#    - Click on the user
#    - Click "Confirm Email"
```

### Option 2: Disable Email Confirmation (Development Only)

```bash
# In Supabase Dashboard:
# 1. Go to Authentication > Settings
# 2. Under "Email Auth", toggle OFF "Enable email confirmations"
# 3. Save changes
# 4. Re-run tests
```

### Option 3: Use Service Role Key for Tests

Update the auth helper to use service role key for testing:

```typescript
// backend/tests/helpers/auth.ts
export async function getAuthenticatedClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!; // Use service role key
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  }

  // Create client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✓ Using service role key for tests');
  return supabase;
}
```

**Note**: Service role key bypasses all RLS policies and should only be used in controlled test environments.

### Option 4: Update Edge Functions to Accept Service Role

Modify Edge Functions to accept both user tokens AND service role key:

```typescript
// supabase/functions/intake-tickets-create/index.ts
serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Check if it's service role key
    const isServiceRole = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_KEY") ?? "");
    
    let user;
    if (isServiceRole) {
      // For service role, create a mock admin user context
      user = { id: "00000000-0000-0000-0000-000000000000", role: "service_role" };
      console.log("✓ Using service role key");
    } else {
      // For regular users, validate JWT
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !authUser) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Invalid user session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      user = authUser;
    }

    // Continue with function logic...
  } catch (error) {
    // ... error handling
  }
});
```

## Quick Test Commands

After applying a fix, test with:

```bash
# Test auth helper
cd backend
npm test tests/contract/tickets.create.test.ts -- --reporter=verbose --run

# Expected: ✓ Tests pass OR more informative error messages
```

## Verification Checklist

- [ ] User email is confirmed in Supabase Dashboard
- [ ] Email confirmation is disabled for development (if applicable)
- [ ] Service role key is available in `.env` file
- [ ] Tests pass with one of the resolution options above

## Next Steps

1. **Choose your preferred option** (Option 1 is recommended for production-like testing)
2. **Apply the fix**
3. **Re-run tests**: `npm test tests/contract/tickets.create.test.ts`
4. **If still failing**, check Supabase logs: `supabase functions logs intake-tickets-create --limit 10`

## Contact

If none of these options work, the issue may be:
- JWT secret mismatch between Auth service and Edge Functions
- Network/firewall blocking Edge Function responses
- Supabase project configuration issue

Check Supabase project logs and contact support if needed.
