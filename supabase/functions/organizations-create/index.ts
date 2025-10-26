/**
 * Edge Function: Create Organization
 *
 * Creates a new organization with validation
 *
 * @endpoint POST /functions/v1/organizations-create
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validate organization data before insertion
 */
function validateOrganization(org: any) {
  const errors: string[] = [];

  // Validate name
  if (!org.name || org.name.trim().length < 2) {
    errors.push('name is required and must be at least 2 characters');
  }
  if (org.name && org.name.length > 200) {
    errors.push('name cannot exceed 200 characters');
  }

  // Validate type
  if (!org.type) {
    errors.push('type is required');
  }
  const allowedTypes = ['government', 'ngo', 'company', 'academic', 'other'];
  if (org.type && !allowedTypes.includes(org.type)) {
    errors.push(`type must be one of: ${allowedTypes.join(', ')}`);
  }

  // Validate country (2-letter ISO code)
  if (org.country) {
    const countryRegex = /^[A-Z]{2}$/;
    if (!countryRegex.test(org.country)) {
      errors.push('country must be a 2-letter ISO country code (e.g., SA, US)');
    }
  }

  // Validate website URL
  if (org.website) {
    try {
      new URL(org.website);
    } catch {
      errors.push('website must be a valid URL');
    }
  }

  // Validate primary_address structure if provided
  if (org.primary_address) {
    if (typeof org.primary_address !== 'object') {
      errors.push('primary_address must be an object');
    } else {
      const address = org.primary_address;
      if (address.street && typeof address.street !== 'string') {
        errors.push('primary_address.street must be a string');
      }
      if (address.city && typeof address.city !== 'string') {
        errors.push('primary_address.city must be a string');
      }
      if (address.postal_code && typeof address.postal_code !== 'string') {
        errors.push('primary_address.postal_code must be a string');
      }
      if (address.country && typeof address.country !== 'string') {
        errors.push('primary_address.country must be a string');
      }
    }
  }

  return errors;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user (JWT validation)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const orgData = await req.json();

    // Validate organization data
    const validationErrors = validateOrganization(orgData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Insert organization
    const { data, error } = await supabaseClient
      .from('cd_organizations')
      .insert(orgData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );
  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});