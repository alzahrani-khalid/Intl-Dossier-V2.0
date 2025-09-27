import Queue from 'bull';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { supabaseAdmin } from '../config/supabase';
import { logInfo, logError } from '../utils/logger';
import NotificationService from '../services/NotificationService';

// Create queues
export const emailQueue = new Queue('email', process.env.REDIS_URL || 'redis://localhost:6379');
export const alertQueue = new Queue('alerts', process.env.REDIS_URL || 'redis://localhost:6379');
export const reportQueue = new Queue('reports', process.env.REDIS_URL || 'redis://localhost:6379');
export const syncQueue = new Queue('sync', process.env.REDIS_URL || 'redis://localhost:6379');

// Process email queue
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  const notificationService = new NotificationService();
  await notificationService.sendEmail(to, subject, html);
  logInfo(`Email job processed: ${job.id}`);
});

// Process alert queue
alertQueue.process(async (job) => {
  const { type, recipients, message } = job.data;
  
  // Check for MoU expiry alerts
  if (type === 'mou_expiry') {
    const { data: expiring } = await supabaseAdmin
      .from('mous')
      .select('*')
      .eq('status', 'active')
      .lte('expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());
    
    if (expiring && expiring.length > 0) {
      for (const mou of expiring) {
        await emailQueue.add('send', {
          to: recipients.join(','),
          subject: `MoU Expiring: ${mou.reference_number}`,
          html: `<p>MoU ${mou.title_en} is expiring on ${mou.expiry_date}</p>`
        });
      }
    }
  }
  
  logInfo(`Alert job processed: ${job.id}`);
});

// Process report generation
reportQueue.process(async (job) => {
  const { type, period, format } = job.data;
  
  // Generate report based on type
  logInfo(`Report generation job processed: ${job.id}`);
});

// Process data sync
syncQueue.process(async (job) => {
  const { source, target } = job.data;
  
  // Sync data between systems
  logInfo(`Sync job processed: ${job.id}`);
});

// Schedule recurring jobs
export function scheduleJobs() {
  // Daily MoU expiry check
  alertQueue.add(
    'check_expiry',
    { type: 'mou_expiry' },
    { repeat: { cron: '0 9 * * *' } }
  );
  
  // Weekly report generation
  reportQueue.add(
    'weekly_report',
    { type: 'weekly', format: 'pdf' },
    { repeat: { cron: '0 10 * * 1' } }
  );
  
  logInfo('Background jobs scheduled');
}

// Create Bull Board for monitoring
const serverAdapter = new ExpressAdapter();
export const bullBoard = createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(alertQueue),
    new BullAdapter(reportQueue),
    new BullAdapter(syncQueue)
  ],
  serverAdapter
});

// Export the router for Express integration
export const bullBoardRouter = serverAdapter.getRouter();

export default {
  emailQueue,
  alertQueue,
  reportQueue,
  syncQueue,
  scheduleJobs,
  bullBoard
};
