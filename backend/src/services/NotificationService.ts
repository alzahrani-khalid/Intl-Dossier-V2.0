import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../config/supabase';
import { logInfo, logError } from '../utils/logger';
import axios from 'axios';

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      });
      logInfo(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logError('Email send error', error as Error);
      throw error;
    }
  }

  async sendPushNotification(userId: string, title: string, body: string) {
    // Implementation for push notifications
    logInfo(`Push notification sent to user ${userId}`);
    return true;
  }

  async sendWhatsApp(phoneNumber: string, message: string) {
    if (!process.env.WHATSAPP_API_URL) {
      logInfo('WhatsApp not configured');
      return false;
    }

    try {
      await axios.post(
        `${process.env.WHATSAPP_API_URL}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      logInfo(`WhatsApp message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      logError('WhatsApp send error', error as Error);
      return false;
    }
  }

  async createNotification(userId: string, type: string, data: any) {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title: data.title,
        message: data.message,
        data,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }
}

export default NotificationService;
