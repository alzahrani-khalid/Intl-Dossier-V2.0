import { Router, Request, Response, NextFunction } from 'express';
import { VectorService } from '../services/vector.service';
import { SearchService } from '../services/search.service';
import { IntelligenceReportModel, IntelligenceReportInput } from '../models/intelligence-report.model';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const vectorService = new VectorService(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const searchService = new SearchService(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  vectorService
);

// GET /api/intelligence-reports
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, page_size = 25 } = req.query;
    
    let query = supabase
      .from('intelligence_reports')
      .select('*', { count: 'exact' });
    
    if (status) {
      query = query.eq('review_status', status);
    }
    
    const offset = (Number(page) - 1) * Number(page_size);
    query = query
      .range(offset, offset + Number(page_size) - 1)
      .order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      data,
      pagination: {
        page: Number(page),
        page_size: Number(page_size),
        total_pages: Math.ceil((count || 0) / Number(page_size)),
        total_items: count
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence-reports
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: IntelligenceReportInput = req.body;
    
    const validationErrors = IntelligenceReportModel.validate(input);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    const { data, error } = await supabase
      .from('intelligence_reports')
      .insert({
        ...input,
        confidence_score: input.confidence_score || 50,
        review_status: 'draft',
        embedding_status: 'pending',
        created_at: new Date(),
        retention_until: IntelligenceReportModel.createRetentionDate(),
        analyst_id: (req as any).user?.id || 'anonymous'
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Try to generate embedding asynchronously
    const text = `${data.title} ${data.content}`;
    vectorService.generateEmbeddingFromText(text).then(embedding => {
      if (embedding) {
        vectorService.createEmbedding({
          report_id: data.id,
          embedding
        }).then(() => {
          supabase
            .from('intelligence_reports')
            .update({ embedding_status: 'completed' })
            .eq('id', data.id)
            .execute();
        }).catch(err => {
          console.error('Failed to save embedding:', err);
          supabase
            .from('intelligence_reports')
            .update({ 
              embedding_status: 'failed',
              embedding_error: err.message
            })
            .eq('id', data.id)
            .execute();
        });
      }
    });
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/intelligence-reports/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('intelligence_reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Resource not found' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence-reports/:id/embedding
router.post('/:id/embedding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const { data: report, error: fetchError } = await supabase
      .from('intelligence_reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Resource not found' });
      }
      return res.status(500).json({ error: fetchError.message });
    }
    
    await supabase
      .from('intelligence_reports')
      .update({ embedding_status: 'processing' })
      .eq('id', id);
    
    const text = `${report.title} ${report.content}`;
    const embedding = await vectorService.generateEmbeddingFromText(text);
    
    if (!embedding) {
      await supabase
        .from('intelligence_reports')
        .update({ embedding_status: 'pending' })
        .eq('id', id);
      
      return res.status(503).json({
        status: 'pending_embedding',
        message: 'Vector service unavailable - document stored for later processing'
      });
    }
    
    try {
      await vectorService.createEmbedding({
        report_id: id,
        embedding
      });
      
      await supabase
        .from('intelligence_reports')
        .update({ embedding_status: 'completed' })
        .eq('id', id);
      
      res.status(202).json({
        status: 'processing',
        message: 'Embedding generation started'
      });
    } catch (embeddingError) {
      await supabase
        .from('intelligence_reports')
        .update({ 
          embedding_status: 'failed',
          embedding_error: (embeddingError as Error).message
        })
        .eq('id', id);
      
      throw embeddingError;
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence-reports/search
router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      query, 
      filters, 
      similarity_threshold = 0.8,
      timeout_ms = 2000
    } = req.body;
    
    const searchResult = await searchService.search({
      query,
      filters,
      similarity_threshold,
      timeout_ms,
      page: req.query.page ? Number(req.query.page) : 1,
      page_size: req.query.page_size as any || 25
    });
    
    if (vectorService.isInFallbackMode()) {
      const fallbackMode = vectorService.getFallbackMode();
      return res.status(503).json({
        results: searchResult.data,
        fallback_mode: fallbackMode
      });
    }
    
    res.json({
      results: searchResult.data,
      partial_results: searchResult.partial_results,
      failed_filters: searchResult.failed_filters
    });
  } catch (error) {
    next(error);
  }
});

export default router;