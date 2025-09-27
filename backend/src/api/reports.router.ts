import { Router, Request, Response, NextFunction } from 'express';
import { ReportingService } from '../services/reporting.service';
import { ReportTemplateInput } from '../models/report-template.model';

const router = Router();

const reportingService = new ReportingService(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// GET /api/reports/templates
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { report_type } = req.query;
    
    const templates = await reportingService.getTemplates(
      report_type as any
    );
    
    res.json({ data: templates });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports/templates
router.post('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: ReportTemplateInput = req.body;
    
    const template = await reportingService.createTemplate(input);
    
    res.status(201).json(template);
  } catch (error) {
    if ((error as Error).message.includes('Validation failed') || 
        (error as Error).message.includes('Template content invalid')) {
      return res.status(400).json({
        error: (error as Error).message,
        details: {}
      });
    }
    next(error);
  }
});

// POST /api/reports/generate
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { template_id, format, filters, language } = req.body;
    
    if (!template_id || !format) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { 
          template_id: template_id ? undefined : 'Required',
          format: format ? undefined : 'Required'
        }
      });
    }
    
    const report = await reportingService.generateReport({
      template_id,
      format,
      language,
      filters
    });
    
    // Set appropriate headers based on format
    res.setHeader('Content-Type', report.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    
    // Send the report data
    if (report.content_type === 'application/json') {
      res.json(report.data);
    } else {
      res.send(report.data);
    }
  } catch (error) {
    if ((error as Error).message.includes('Template not found')) {
      return res.status(404).json({ error: 'Template not found' });
    }
    if ((error as Error).message.includes('not supported')) {
      return res.status(400).json({
        error: (error as Error).message,
        details: {}
      });
    }
    next(error);
  }
});

// POST /api/reports/schedule
router.post('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      template_id, 
      frequency, 
      format, 
      schedule_time,
      email_recipients 
    } = req.body;
    
    if (!template_id || !frequency || !format) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          template_id: template_id ? undefined : 'Required',
          frequency: frequency ? undefined : 'Required',
          format: format ? undefined : 'Required'
        }
      });
    }
    
    const schedule = await reportingService.scheduleReport(
      template_id,
      frequency,
      format,
      email_recipients || []
    );
    
    res.status(201).json({
      schedule_id: schedule.id,
      next_run: schedule.next_run
    });
  } catch (error) {
    if ((error as Error).message.includes('Template not found')) {
      return res.status(404).json({ error: 'Template not found' });
    }
    next(error);
  }
});

export default router;