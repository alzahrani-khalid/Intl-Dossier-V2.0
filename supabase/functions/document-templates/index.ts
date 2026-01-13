import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ListTemplatesParams {
  category?: string;
  entity_type?: string;
  status?: string;
  include_system?: boolean;
  limit?: number;
  offset?: number;
}

interface CreateTemplatedDocumentParams {
  template_id: string;
  entity_type: string;
  entity_id: string;
  title_en: string;
  title_ar: string;
  classification?: string;
}

interface UpdateTemplatedDocumentParams {
  id: string;
  field_values?: Record<string, unknown>;
  current_section_order?: number;
  title_en?: string;
  title_ar?: string;
  classification?: string;
}

interface CompleteDocumentParams {
  id: string;
  generate_document?: boolean;
  output_format?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Create client with user's auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Route based on method and action
    if (req.method === 'GET') {
      if (action === 'list' || action === 'document-templates') {
        return await listTemplates(supabase, url.searchParams);
      } else if (action === 'my-documents') {
        return await listUserDocuments(supabase, user.id, url.searchParams);
      } else if (pathParts.length >= 2) {
        // Get specific template: /document-templates/{id}
        const templateId = pathParts[pathParts.length - 1];
        if (templateId !== 'list' && templateId !== 'my-documents') {
          return await getTemplate(supabase, templateId);
        }
      }
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (action === 'create-document') {
        return await createTemplatedDocument(supabase, user.id, body);
      } else if (action === 'update-document') {
        return await updateTemplatedDocument(supabase, user.id, body);
      } else if (action === 'complete-document') {
        return await completeDocument(supabase, user.id, body);
      } else if (action === 'validate') {
        return await validateDocument(supabase, body);
      }
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      if (action === 'delete-document') {
        return await deleteTemplatedDocument(supabase, user.id, body.id);
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listTemplates(
  supabase: ReturnType<typeof createClient>,
  searchParams: URLSearchParams
) {
  const category = searchParams.get('category');
  const entityType = searchParams.get('entity_type');
  const status = searchParams.get('status') || 'published';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('document_templates')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('name_en', { ascending: true })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (entityType) {
    query = query.contains('target_entity_types', [entityType]);
  }

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      templates: data,
      total: count || 0,
      limit,
      offset,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getTemplate(supabase: ReturnType<typeof createClient>, templateId: string) {
  // Get template
  const { data: template, error: templateError } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) {
    return new Response(JSON.stringify({ error: templateError.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get sections with fields
  const { data: sections, error: sectionsError } = await supabase
    .from('document_template_sections')
    .select('*')
    .eq('template_id', templateId)
    .order('section_order', { ascending: true });

  if (sectionsError) {
    return new Response(JSON.stringify({ error: sectionsError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get fields for each section
  const sectionIds = sections?.map((s) => s.id) || [];
  const { data: fields, error: fieldsError } = await supabase
    .from('document_template_fields')
    .select('*')
    .in('section_id', sectionIds)
    .order('field_order', { ascending: true });

  if (fieldsError) {
    return new Response(JSON.stringify({ error: fieldsError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Organize fields by section
  const sectionsWithFields = sections?.map((section) => ({
    ...section,
    fields: fields?.filter((f) => f.section_id === section.id) || [],
  }));

  return new Response(
    JSON.stringify({
      template,
      sections: sectionsWithFields,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function listUserDocuments(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  searchParams: URLSearchParams
) {
  const entityType = searchParams.get('entity_type');
  const entityId = searchParams.get('entity_id');
  const isComplete = searchParams.get('is_complete');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('templated_documents')
    .select(
      `
      *,
      template:document_templates(id, name_en, name_ar, category, icon, color)
    `,
      { count: 'exact' }
    )
    .eq('created_by', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (entityId) {
    query = query.eq('entity_id', entityId);
  }

  if (isComplete !== null) {
    query = query.eq('is_complete', isComplete === 'true');
  }

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      documents: data,
      total: count || 0,
      limit,
      offset,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function createTemplatedDocument(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: CreateTemplatedDocumentParams
) {
  const { template_id, entity_type, entity_id, title_en, title_ar, classification } = params;

  // Validate template exists
  const { data: template, error: templateError } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', template_id)
    .eq('status', 'published')
    .single();

  if (templateError || !template) {
    return new Response(JSON.stringify({ error: 'Template not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create the templated document
  const { data: document, error: createError } = await supabase
    .from('templated_documents')
    .insert({
      template_id,
      entity_type,
      entity_id,
      title_en,
      title_ar,
      classification: classification || template.default_classification,
      field_values: {},
      current_section_order: 1,
      is_complete: false,
      created_by: userId,
    })
    .select()
    .single();

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch full template with sections
  const templateResponse = await getTemplate(supabase, template_id);
  const templateData = await templateResponse.json();

  return new Response(
    JSON.stringify({
      document,
      template: {
        ...templateData.template,
        sections: templateData.sections,
      },
    }),
    {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function updateTemplatedDocument(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: UpdateTemplatedDocumentParams
) {
  const { id, field_values, current_section_order, title_en, title_ar, classification } = params;

  // Check ownership
  const { data: existing, error: checkError } = await supabase
    .from('templated_documents')
    .select('*, template:document_templates(id)')
    .eq('id', id)
    .eq('created_by', userId)
    .single();

  if (checkError || !existing) {
    return new Response(JSON.stringify({ error: 'Document not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (field_values !== undefined) {
    // Merge with existing field values
    updateData.field_values = {
      ...(existing.field_values || {}),
      ...field_values,
    };
  }

  if (current_section_order !== undefined) {
    updateData.current_section_order = current_section_order;
  }

  if (title_en !== undefined) {
    updateData.title_en = title_en;
  }

  if (title_ar !== undefined) {
    updateData.title_ar = title_ar;
  }

  if (classification !== undefined) {
    updateData.classification = classification;
  }

  // Update the document
  const { data: document, error: updateError } = await supabase
    .from('templated_documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate current fields
  const { data: validationResult } = await supabase.rpc('validate_templated_document_fields', {
    p_template_id: existing.template.id,
    p_field_values: document.field_values,
  });

  return new Response(
    JSON.stringify({
      document,
      validation: validationResult || { valid: true, errors: [] },
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function completeDocument(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: CompleteDocumentParams
) {
  const { id, generate_document = true, output_format = 'docx' } = params;

  // Check ownership and get document
  const { data: existing, error: checkError } = await supabase
    .from('templated_documents')
    .select('*, template:document_templates(*)')
    .eq('id', id)
    .eq('created_by', userId)
    .single();

  if (checkError || !existing) {
    return new Response(JSON.stringify({ error: 'Document not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate all required fields
  const { data: validationResult } = await supabase.rpc('validate_templated_document_fields', {
    p_template_id: existing.template.id,
    p_field_values: existing.field_values,
  });

  if (validationResult && !validationResult.valid) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        validation: validationResult,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Mark as complete
  const { data: document, error: updateError } = await supabase
    .from('templated_documents')
    .update({
      is_complete: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // TODO: If generate_document is true, generate the actual document file
  // This would involve creating a document in Supabase Storage
  // and creating a record in the documents table

  return new Response(
    JSON.stringify({
      document,
      generated_document_id: null,
      generated_file_path: null,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function validateDocument(
  supabase: ReturnType<typeof createClient>,
  params: { template_id: string; field_values: Record<string, unknown> }
) {
  const { template_id, field_values } = params;

  const { data: validationResult, error } = await supabase.rpc(
    'validate_templated_document_fields',
    {
      p_template_id: template_id,
      p_field_values: field_values,
    }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(validationResult), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteTemplatedDocument(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  documentId: string
) {
  const { error } = await supabase
    .from('templated_documents')
    .delete()
    .eq('id', documentId)
    .eq('created_by', userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
