/**
 * Briefing Pack PDF Generator Service (T031)
 * Generates bilingual PDF briefing packs using React-PDF
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Position {
  id: string;
  title: string;
  content: string;
  type: string;
  primary_language: 'en' | 'ar';
  created_at: string;
  updated_at: string;
}

interface Engagement {
  id: string;
  title: string;
  description?: string;
  date: string;
  stakeholders?: string[];
}

interface BriefingPackOptions {
  engagement: Engagement;
  positions: Position[];
  language: 'en' | 'ar';
  generatedBy: string;
}

interface TranslationResult {
  translatedText: string;
  originalLanguage: string;
  targetLanguage: string;
}

/**
 * Translate text using AnythingLLM
 */
async function translateText(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  const anythingLLMUrl = Deno.env.get('ANYTHINGLLM_URL');
  const anythingLLMKey = Deno.env.get('ANYTHINGLLM_API_KEY');

  if (!anythingLLMUrl || !anythingLLMKey) {
    console.warn('AnythingLLM not configured, returning original text');
    return text;
  }

  try {
    const response = await fetch(`${anythingLLMUrl}/api/v1/workspace/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anythingLLMKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        from_language: fromLang,
        to_language: toLang,
        context: 'diplomatic briefing document',
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout per translation
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.translated_text || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Translate position if language mismatch
 */
async function translatePositionIfNeeded(
  position: Position,
  targetLang: 'en' | 'ar'
): Promise<Position> {
  if (position.primary_language === targetLang) {
    return position;
  }

  console.log(
    `Translating position ${position.id} from ${position.primary_language} to ${targetLang}`
  );

  const translatedTitle = await translateText(
    position.title,
    position.primary_language,
    targetLang
  );

  const translatedContent = await translateText(
    position.content,
    position.primary_language,
    targetLang
  );

  return {
    ...position,
    title: translatedTitle,
    content: translatedContent,
    primary_language: targetLang,
  };
}

/**
 * Generate HTML template for PDF (simplified approach for Deno)
 * Note: React-PDF requires Node.js environment, so we'll use HTML-to-PDF approach
 */
function generateHTMLTemplate(
  engagement: Engagement,
  positions: Position[],
  language: 'en' | 'ar'
): string {
  const isRTL = language === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const labels = {
    en: {
      title: 'Briefing Pack',
      engagement: 'Engagement',
      date: 'Date',
      stakeholders: 'Key Stakeholders',
      positions: 'Talking Points & Positions',
      positionType: 'Type',
      generatedOn: 'Generated on',
    },
    ar: {
      title: 'حزمة الإحاطة',
      engagement: 'الموضوع',
      date: 'التاريخ',
      stakeholders: 'أصحاب المصلحة الرئيسيون',
      positions: 'النقاط والمواقف',
      positionType: 'النوع',
      generatedOn: 'تم الإنشاء في',
    },
  };

  const l = labels[language];

  const stakeholdersList = engagement.stakeholders?.length
    ? `<ul>
        ${engagement.stakeholders.map((s) => `<li>${s}</li>`).join('')}
      </ul>`
    : '';

  const positionsList = positions
    .map(
      (pos, index) => `
      <div class="position-section">
        <h3>${index + 1}. ${pos.title}</h3>
        <p class="position-type"><strong>${l.positionType}:</strong> ${pos.type}</p>
        <div class="position-content">${pos.content}</div>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="${direction}" lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${l.title}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }

        body {
          font-family: ${isRTL ? 'Arial, sans-serif' : 'Georgia, serif'};
          direction: ${direction};
          text-align: ${isRTL ? 'right' : 'left'};
          line-height: 1.6;
          color: #333;
        }

        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #1e40af;
          font-size: 28px;
          margin: 0;
        }

        .logo {
          max-width: 150px;
          margin-bottom: 15px;
        }

        .metadata {
          background-color: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .metadata h2 {
          color: #1e40af;
          font-size: 24px;
          margin-top: 0;
        }

        .metadata p {
          margin: 10px 0;
          font-size: 14px;
        }

        .metadata strong {
          color: #374151;
        }

        .position-section {
          page-break-inside: avoid;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .position-section h3 {
          color: #1e40af;
          font-size: 20px;
          margin-top: 0;
        }

        .position-type {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 15px;
        }

        .position-content {
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.8;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${l.title}</h1>
        <p>GASTAT International Dossier System</p>
      </div>

      <div class="metadata">
        <h2>${engagement.title}</h2>
        <p><strong>${l.date}:</strong> ${new Date(engagement.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
        ${
          engagement.description
            ? `<p><strong>${l.engagement}:</strong> ${engagement.description}</p>`
            : ''
        }
        ${
          stakeholdersList
            ? `<p><strong>${l.stakeholders}:</strong></p>${stakeholdersList}`
            : ''
        }
      </div>

      <h2>${l.positions}</h2>
      ${positionsList}

      <div class="footer">
        <p>${l.generatedOn} ${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
        <p>GASTAT - General Authority for Statistics</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Convert HTML to PDF using external service or library
 * For now, we'll store the HTML and let the client render it
 * In production, integrate with a PDF generation service
 */
async function convertHTMLToPDF(html: string): Promise<Uint8Array> {
  // TODO: Integrate with PDF generation service (e.g., Puppeteer, WeasyPrint)
  // For now, return HTML as Uint8Array (will be stored as HTML file)
  const encoder = new TextEncoder();
  return encoder.encode(html);
}

/**
 * Main function to generate briefing pack
 */
export async function generateBriefingPack(
  options: BriefingPackOptions
): Promise<{ fileContent: Uint8Array; fileName: string; fileSize: number }> {
  const { engagement, positions, language, generatedBy } = options;

  console.log(
    `Generating ${language} briefing pack for engagement ${engagement.id} with ${positions.length} positions`
  );

  // Step 1: Translate positions if needed (parallel translation)
  const translationPromises = positions.map((pos) =>
    translatePositionIfNeeded(pos, language)
  );

  const translatedPositions = await Promise.all(translationPromises);

  console.log(`Translation complete for ${translatedPositions.length} positions`);

  // Step 2: Generate HTML template
  const html = generateHTMLTemplate(engagement, translatedPositions, language);

  // Step 3: Convert HTML to PDF
  const fileContent = await convertHTMLToPDF(html);

  // Step 4: Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `briefing-pack-${engagement.id}-${language}-${timestamp}.html`;

  return {
    fileContent,
    fileName,
    fileSize: fileContent.length,
  };
}

/**
 * Upload briefing pack to Supabase Storage
 */
export async function uploadBriefingPack(
  supabaseUrl: string,
  supabaseKey: string,
  fileContent: Uint8Array,
  fileName: string
): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage
    .from('briefing-packs')
    .upload(fileName, fileContent, {
      contentType: 'text/html', // Will be application/pdf once PDF generation is implemented
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload briefing pack: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('briefing-packs')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Save briefing pack metadata to database
 */
export async function saveBriefingPackMetadata(
  supabaseUrl: string,
  supabaseKey: string,
  engagementId: string,
  positionIds: string[],
  language: 'en' | 'ar',
  generatedBy: string,
  fileUrl: string,
  fileSize: number
): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('briefing_packs')
    .insert({
      engagement_id: engagementId,
      position_ids: positionIds,
      language,
      generated_by: generatedBy,
      file_url: fileUrl,
      file_size_bytes: fileSize,
      expires_at: null, // No expiration for now
      metadata: {
        position_count: positionIds.length,
        generated_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to save briefing pack metadata: ${error.message}`);
  }

  return data.id;
}
