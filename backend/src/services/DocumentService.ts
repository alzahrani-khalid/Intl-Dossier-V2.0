import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export class DocumentService {
  private readonly cachePrefix = 'document:';

  async uploadDocument(file: Express.Multer.File, metadata: any, userId: string) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('documents')
        .upload(`${metadata.entity_type}/${metadata.entity_id}/${file.filename}`, file.buffer);

      if (error) throw error;

      const document = await supabaseAdmin
        .from('documents')
        .insert({
          ...metadata,
          file_path: data.path,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      logInfo(`Document uploaded: ${file.filename}`);
      return document.data;
    } catch (error) {
      logError('Document upload error', error as Error);
      throw error;
    }
  }

  async getDocument(id: string) {
    const cached = await cacheHelpers.get(`${this.cachePrefix}${id}`);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) await cacheHelpers.set(`${this.cachePrefix}${id}`, data, 3600);
    return data;
  }

  async searchDocuments(query: string, filters: any = {}) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .textSearch('title_en', query)
      .match(filters)
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  // Missing methods for API endpoints
  async findAll(filters?: any) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async upload(file: Express.Multer.File, metadata: any) {
    return this.uploadDocument(file, metadata, metadata.uploaded_by || 'system');
  }

  async findById(id: string) {
    return this.getDocument(id);
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Clear cache
    await cacheHelpers.del(`${this.cachePrefix}${id}`);

    return { success: true };
  }
}

export default DocumentService;
