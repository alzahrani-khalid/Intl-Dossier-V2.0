import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../config/supabase';
import { logInfo, logError } from '../utils/logger';
import fs from 'fs';

export class ExportService {
  async exportToPDF(data: any, type: string): Promise<Buffer> {
    try {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));

      // Add content based on type
      doc.fontSize(20).text(`GASTAT ${type} Report`, 100, 100);
      doc.fontSize(12).text(JSON.stringify(data, null, 2), 100, 150);

      doc.end();

      return new Promise((resolve) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          logInfo(`PDF exported for ${type}`);
          resolve(pdfBuffer);
        });
      });
    } catch (error) {
      logError('PDF export error', error as Error);
      throw error;
    }
  }

  async exportToExcel(data: any[], type: string): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(type);

      if (data.length > 0) {
        // Add headers
        worksheet.columns = Object.keys(data[0]).map(key => ({
          header: key,
          key: key,
          width: 15
        }));

        // Add rows
        worksheet.addRows(data);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      logInfo(`Excel exported for ${type}`);
      return Buffer.from(buffer);
    } catch (error) {
      logError('Excel export error', error as Error);
      throw error;
    }
  }

  async exportData(entityType: string, entityId: string, format: 'pdf' | 'excel' | 'json') {
    const { data, error } = await supabaseAdmin
      .from(entityType)
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) throw error;

    switch (format) {
      case 'pdf':
        return await this.exportToPDF(data, entityType);
      case 'excel':
        return await this.exportToExcel([data], entityType);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

export default ExportService;
