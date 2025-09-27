#!/bin/bash

echo "🔧 Fixing remaining service methods..."

# Fix OrganizationService
cat << 'EOF' >> src/services/OrganizationService.ts

  // Missing methods for API endpoints
  async findAll(filters?: any) {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string) {
    const cached = await cacheHelpers.get(`${this.cachePrefix}${id}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) await cacheHelpers.set(`${this.cachePrefix}${id}`, data, 3600);
    return data;
  }

  async create(organization: any) {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert(organization)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await cacheHelpers.del(`${this.cachePrefix}${id}`);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await cacheHelpers.del(`${this.cachePrefix}${id}`);
    return { success: true };
  }
}
EOF

# Fix IntelligenceService
cat << 'EOF' >> src/services/IntelligenceService.ts

  // Missing methods for API endpoints
  async getInsights(filters?: any) {
    const { data, error } = await supabaseAdmin
      .from('intelligence')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createInsight(insight: any) {
    const { data, error } = await supabaseAdmin
      .from('intelligence')
      .insert(insight)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async analyzeEntity(entityId: string, entityType: string) {
    // Placeholder for entity analysis logic
    return {
      entityId,
      entityType,
      insights: [],
      score: 0,
      recommendations: []
    };
  }

  async generateSuggestions(context: any) {
    // Placeholder for suggestion generation
    return {
      suggestions: [],
      confidence: 0
    };
  }

  async extractKeyPoints(text: string) {
    // Placeholder for key point extraction
    return {
      keyPoints: [],
      summary: text.substring(0, 200)
    };
  }

  async extractActionItems(text: string) {
    // Placeholder for action item extraction
    return {
      actionItems: [],
      count: 0
    };
  }

  async storeFeedback(feedback: any) {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert(feedback)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
EOF

# Fix SearchService
cat << 'EOF' >> src/services/SearchService.ts

  // Missing methods for API endpoints
  async search(query: string, filters?: any) {
    const { data, error } = await supabaseAdmin
      .from('dossiers')
      .select('*')
      .textSearch('title', query)
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async getSuggestions(query: string) {
    // Placeholder for search suggestions
    return {
      suggestions: [],
      related: []
    };
  }
}
EOF

# Fix RelationshipHealthService
cat << 'EOF' >> src/services/RelationshipHealthService.ts

  // Missing method for API endpoints
  async getRecommendations(relationshipId: string) {
    // Placeholder for recommendation logic
    return {
      relationshipId,
      recommendations: [
        'Schedule regular meetings',
        'Update contact information',
        'Review recent interactions'
      ],
      priority: 'medium'
    };
  }
}
EOF

echo "✅ Service methods added"