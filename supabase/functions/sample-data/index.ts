import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface TemplateData {
  dossiers: Array<{
    name_en: string;
    name_ar: string;
    type: string;
    status: string;
    sensitivity_level: string;
    summary_en: string;
    summary_ar: string;
    tags: string[];
  }>;
  relationships: Array<{
    from_index: number;
    to_index: number;
    type: string;
    notes_en: string;
    notes_ar: string;
  }>;
  contacts: Array<{
    name: string;
    role: string;
    organization: string;
    email: string;
  }>;
  events: Array<{
    title_en: string;
    title_ar: string;
    date: string;
    type: string;
  }>;
}

interface Template {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  color: string;
  template_data: TemplateData;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action'); // list-templates, populate, remove, status

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user by passing the JWT token directly
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different actions
    switch (action) {
      case 'list-templates':
        return await listTemplates(supabaseClient);

      case 'populate':
        if (req.method !== 'POST') {
          return methodNotAllowed();
        }
        const populateBody = await req.json();
        return await populateSampleData(supabaseClient, user.id, populateBody.template_slug);

      case 'remove':
        if (req.method !== 'POST') {
          return methodNotAllowed();
        }
        const removeBody = await req.json();
        return await removeSampleData(supabaseClient, user.id, removeBody.instance_id);

      case 'status':
        return await getSampleDataStatus(supabaseClient, user.id);

      default:
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_ACTION',
              message_en: 'Invalid action. Use: list-templates, populate, remove, or status',
              message_ar: 'إجراء غير صالح. استخدم: list-templates, populate, remove, أو status',
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function methodNotAllowed() {
  return new Response(
    JSON.stringify({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message_en: 'Method not allowed',
        message_ar: 'الطريقة غير مسموح بها',
      },
    }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// List available templates
async function listTemplates(supabaseClient: ReturnType<typeof createClient>) {
  const { data: templates, error } = await supabaseClient
    .from('sample_data_templates')
    .select('id, slug, name_en, name_ar, description_en, description_ar, icon, color, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching templates:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FETCH_ERROR',
          message_en: 'Failed to fetch templates',
          message_ar: 'فشل في جلب القوالب',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      templates: templates || [],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Get sample data status for user
async function getSampleDataStatus(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
) {
  // Check if user has active sample data
  const { data: instances, error } = await supabaseClient
    .from('sample_data_instances')
    .select(
      `
      id,
      populated_at,
      created_dossier_ids,
      created_relationship_ids,
      created_event_ids,
      created_contact_ids,
      template:template_id (
        slug,
        name_en,
        name_ar,
        icon,
        color
      )
    `
    )
    .eq('user_id', userId)
    .is('removed_at', null);

  if (error) {
    console.error('Error fetching sample data status:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FETCH_ERROR',
          message_en: 'Failed to fetch sample data status',
          message_ar: 'فشل في جلب حالة البيانات النموذجية',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const hasActiveSampleData = instances && instances.length > 0;
  const activeInstances = (instances || []).map(
    (i: {
      id: string;
      populated_at: string;
      created_dossier_ids: string[];
      created_relationship_ids: string[];
      created_event_ids: string[];
      created_contact_ids: string[];
      template: {
        slug: string;
        name_en: string;
        name_ar: string;
        icon: string;
        color: string;
      };
    }) => ({
      id: i.id,
      populated_at: i.populated_at,
      template: i.template,
      counts: {
        dossiers: i.created_dossier_ids?.length || 0,
        relationships: i.created_relationship_ids?.length || 0,
        events: i.created_event_ids?.length || 0,
        contacts: i.created_contact_ids?.length || 0,
      },
    })
  );

  return new Response(
    JSON.stringify({
      has_sample_data: hasActiveSampleData,
      instances: activeInstances,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Populate sample data from template
async function populateSampleData(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  templateSlug: string
) {
  if (!templateSlug) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'template_slug is required',
          message_ar: 'معرف القالب مطلوب',
        },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Fetch template
  const { data: template, error: templateError } = await supabaseClient
    .from('sample_data_templates')
    .select('*')
    .eq('slug', templateSlug)
    .eq('is_active', true)
    .single();

  if (templateError || !template) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message_en: 'Template not found',
          message_ar: 'القالب غير موجود',
        },
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if user already has sample data from this template
  const { data: existingInstance } = await supabaseClient
    .from('sample_data_instances')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', template.id)
    .is('removed_at', null)
    .single();

  if (existingInstance) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'ALREADY_EXISTS',
          message_en: 'You already have sample data from this template. Remove it first.',
          message_ar: 'لديك بالفعل بيانات نموذجية من هذا القالب. قم بإزالتها أولاً.',
        },
      }),
      {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const templateData = template.template_data as TemplateData;
  const createdDossierIds: string[] = [];
  const createdRelationshipIds: string[] = [];
  const createdEventIds: string[] = [];
  const createdContactIds: string[] = [];

  try {
    // 1. Create dossiers
    const dossierIdMap = new Map<number, string>();

    for (let i = 0; i < templateData.dossiers.length; i++) {
      const dossierData = templateData.dossiers[i];

      const { data: dossier, error: dossierError } = await supabaseClient
        .from('dossiers')
        .insert({
          name_en: `[Sample] ${dossierData.name_en}`,
          name_ar: `[نموذج] ${dossierData.name_ar}`,
          type: dossierData.type,
          status: dossierData.status || 'active',
          sensitivity_level: dossierData.sensitivity_level || 'low',
          summary_en: dossierData.summary_en,
          summary_ar: dossierData.summary_ar,
          tags: [...(dossierData.tags || []), 'sample-data', templateSlug],
        })
        .select('id')
        .single();

      if (dossierError) {
        console.error('Error creating dossier:', dossierError);
        throw new Error(`Failed to create dossier: ${dossierData.name_en}`);
      }

      createdDossierIds.push(dossier.id);
      dossierIdMap.set(i, dossier.id);

      // Assign user as owner
      await supabaseClient.from('dossier_owners').insert({
        dossier_id: dossier.id,
        user_id: userId,
        role_type: 'owner',
      });
    }

    // 2. Create relationships between dossiers
    for (const rel of templateData.relationships || []) {
      const fromId = dossierIdMap.get(rel.from_index);
      const toId = dossierIdMap.get(rel.to_index);

      if (fromId && toId) {
        const { data: relationship, error: relError } = await supabaseClient
          .from('dossier_relationships')
          .insert({
            source_dossier_id: fromId,
            target_dossier_id: toId,
            relationship_type: rel.type,
            notes_en: rel.notes_en,
            notes_ar: rel.notes_ar,
          })
          .select('id')
          .single();

        if (!relError && relationship) {
          createdRelationshipIds.push(relationship.id);
        }
      }
    }

    // 3. Create key contacts (associate with first dossier)
    if (createdDossierIds.length > 0) {
      for (const contact of templateData.contacts || []) {
        const { data: newContact, error: contactError } = await supabaseClient
          .from('key_contacts')
          .insert({
            dossier_id: createdDossierIds[0],
            name: contact.name,
            role: contact.role,
            organization: contact.organization,
            email: contact.email,
            notes: `[Sample data from ${templateSlug} template]`,
          })
          .select('id')
          .single();

        if (!contactError && newContact) {
          createdContactIds.push(newContact.id);
        }
      }
    }

    // 4. Create calendar events (link to dossiers cyclically)
    for (let i = 0; i < (templateData.events || []).length; i++) {
      const event = templateData.events[i];
      const linkedDossierId = createdDossierIds[i % createdDossierIds.length];

      const { data: newEvent, error: eventError } = await supabaseClient
        .from('calendar_entries')
        .insert({
          title_en: `[Sample] ${event.title_en}`,
          title_ar: `[نموذج] ${event.title_ar}`,
          start_date: event.date,
          end_date: event.date,
          event_type: event.type || 'meeting',
          related_dossier_id: linkedDossierId,
          description_en: `Sample event from ${template.name_en} template`,
          description_ar: `حدث نموذجي من قالب ${template.name_ar}`,
        })
        .select('id')
        .single();

      if (!eventError && newEvent) {
        createdEventIds.push(newEvent.id);
      }
    }

    // 5. Record the sample data instance
    const { data: instance, error: instanceError } = await supabaseClient
      .from('sample_data_instances')
      .insert({
        user_id: userId,
        template_id: template.id,
        created_dossier_ids: createdDossierIds,
        created_relationship_ids: createdRelationshipIds,
        created_event_ids: createdEventIds,
        created_contact_ids: createdContactIds,
      })
      .select('id, populated_at')
      .single();

    if (instanceError) {
      console.error('Error recording sample data instance:', instanceError);
      // Try to clean up created data
      await cleanupCreatedData(
        supabaseClient,
        createdDossierIds,
        createdRelationshipIds,
        createdEventIds,
        createdContactIds
      );
      throw new Error('Failed to record sample data instance');
    }

    return new Response(
      JSON.stringify({
        success: true,
        instance_id: instance.id,
        populated_at: instance.populated_at,
        template: {
          slug: template.slug,
          name_en: template.name_en,
          name_ar: template.name_ar,
        },
        counts: {
          dossiers: createdDossierIds.length,
          relationships: createdRelationshipIds.length,
          events: createdEventIds.length,
          contacts: createdContactIds.length,
        },
        message_en: `Successfully populated ${createdDossierIds.length} dossiers with sample data`,
        message_ar: `تم ملء ${createdDossierIds.length} ملفات ببيانات نموذجية بنجاح`,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error populating sample data:', error);

    // Cleanup on failure
    await cleanupCreatedData(
      supabaseClient,
      createdDossierIds,
      createdRelationshipIds,
      createdEventIds,
      createdContactIds
    );

    return new Response(
      JSON.stringify({
        error: {
          code: 'POPULATION_ERROR',
          message_en: 'Failed to populate sample data',
          message_ar: 'فشل في ملء البيانات النموذجية',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Remove sample data
async function removeSampleData(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  instanceId?: string
) {
  // Get sample data instance(s) to remove
  let query = supabaseClient
    .from('sample_data_instances')
    .select('*')
    .eq('user_id', userId)
    .is('removed_at', null);

  if (instanceId) {
    query = query.eq('id', instanceId);
  }

  const { data: instances, error: fetchError } = await query;

  if (fetchError) {
    console.error('Error fetching sample data instances:', fetchError);
    return new Response(
      JSON.stringify({
        error: {
          code: 'FETCH_ERROR',
          message_en: 'Failed to fetch sample data instances',
          message_ar: 'فشل في جلب مثيلات البيانات النموذجية',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!instances || instances.length === 0) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message_en: 'No sample data found to remove',
          message_ar: 'لم يتم العثور على بيانات نموذجية لإزالتها',
        },
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  let totalRemoved = {
    dossiers: 0,
    relationships: 0,
    events: 0,
    contacts: 0,
  };

  for (const instance of instances) {
    // Delete created entities
    const removed = await cleanupCreatedData(
      supabaseClient,
      instance.created_dossier_ids || [],
      instance.created_relationship_ids || [],
      instance.created_event_ids || [],
      instance.created_contact_ids || []
    );

    totalRemoved.dossiers += removed.dossiers;
    totalRemoved.relationships += removed.relationships;
    totalRemoved.events += removed.events;
    totalRemoved.contacts += removed.contacts;

    // Mark instance as removed
    await supabaseClient
      .from('sample_data_instances')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', instance.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      removed: totalRemoved,
      message_en: `Successfully removed sample data: ${totalRemoved.dossiers} dossiers, ${totalRemoved.relationships} relationships, ${totalRemoved.events} events, ${totalRemoved.contacts} contacts`,
      message_ar: `تمت إزالة البيانات النموذجية بنجاح: ${totalRemoved.dossiers} ملفات، ${totalRemoved.relationships} علاقات، ${totalRemoved.events} أحداث، ${totalRemoved.contacts} جهات اتصال`,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Helper to cleanup created data
async function cleanupCreatedData(
  supabaseClient: ReturnType<typeof createClient>,
  dossierIds: string[],
  relationshipIds: string[],
  eventIds: string[],
  contactIds: string[]
): Promise<{ dossiers: number; relationships: number; events: number; contacts: number }> {
  const removed = { dossiers: 0, relationships: 0, events: 0, contacts: 0 };

  // Delete contacts first (FK to dossiers)
  if (contactIds.length > 0) {
    const { count } = await supabaseClient.from('key_contacts').delete().in('id', contactIds);
    removed.contacts = count || 0;
  }

  // Delete events
  if (eventIds.length > 0) {
    const { count } = await supabaseClient.from('calendar_entries').delete().in('id', eventIds);
    removed.events = count || 0;
  }

  // Delete relationships
  if (relationshipIds.length > 0) {
    const { count } = await supabaseClient
      .from('dossier_relationships')
      .delete()
      .in('id', relationshipIds);
    removed.relationships = count || 0;
  }

  // Delete dossiers (will cascade delete owners, briefs, etc.)
  if (dossierIds.length > 0) {
    const { count } = await supabaseClient.from('dossiers').delete().in('id', dossierIds);
    removed.dossiers = count || 0;
  }

  return removed;
}
