import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for position data
interface PositionEditorData {
  id?: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  rationale_en?: string;
  rationale_ar?: string;
  alignment_notes_en?: string;
  alignment_notes_ar?: string;
  version: number;
}

interface PositionEditorProps {
  initialData?: Partial<PositionEditorData>;
  onSave: (data: PositionEditorData) => Promise<void>;
  onConflict?: (currentVersion: number, serverVersion: number) => void;
  readOnly?: boolean;
  autoSaveInterval?: number; // milliseconds, default 30000 (30s)
  className?: string;
}

interface EditorMenuBarProps {
  editor: Editor | null;
  disabled?: boolean;
}

// Editor toolbar component
function EditorMenuBar({ editor, disabled = false }: EditorMenuBarProps) {
  const { t } = useTranslation('positions');

  if (!editor) return null;

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1" role="toolbar" aria-label={t('positions.editor.toolbar')}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
        className={cn(editor.isActive('bold') && 'bg-gray-100')}
        aria-label={t('positions.editor.bold')}
        aria-pressed={editor.isActive('bold')}
      >
        <strong>B</strong>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        className={cn(editor.isActive('italic') && 'bg-gray-100')}
        aria-label={t('positions.editor.italic')}
        aria-pressed={editor.isActive('italic')}
      >
        <em>I</em>
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        className={cn(editor.isActive('heading', { level: 2 }) && 'bg-gray-100')}
        aria-label={t('positions.editor.heading2')}
        aria-pressed={editor.isActive('heading', { level: 2 })}
      >
        H2
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
        className={cn(editor.isActive('heading', { level: 3 }) && 'bg-gray-100')}
        aria-label={t('positions.editor.heading3')}
        aria-pressed={editor.isActive('heading', { level: 3 })}
      >
        H3
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        className={cn(editor.isActive('bulletList') && 'bg-gray-100')}
        aria-label={t('positions.editor.bulletList')}
        aria-pressed={editor.isActive('bulletList')}
      >
        •
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        className={cn(editor.isActive('orderedList') && 'bg-gray-100')}
        aria-label={t('positions.editor.orderedList')}
        aria-pressed={editor.isActive('orderedList')}
      >
        1.
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
        className={cn(editor.isActive('blockquote') && 'bg-gray-100')}
        aria-label={t('positions.editor.quote')}
        aria-pressed={editor.isActive('blockquote')}
      >
        &quot;
      </Button>
    </div>
  );
}

export function PositionEditor({
  initialData,
  onSave,
  onConflict,
  readOnly = false,
  autoSaveInterval = 30000,
  className,
}: PositionEditorProps) {
  const { t, i18n } = useTranslation('positions');
  const isRTL = i18n.language === 'ar';

  // Form state
  const [formData, setFormData] = useState<PositionEditorData>({
    title_en: initialData?.title_en || '',
    title_ar: initialData?.title_ar || '',
    content_en: initialData?.content_en || '',
    content_ar: initialData?.content_ar || '',
    rationale_en: initialData?.rationale_en || '',
    rationale_ar: initialData?.rationale_ar || '',
    alignment_notes_en: initialData?.alignment_notes_en || '',
    alignment_notes_ar: initialData?.alignment_notes_ar || '',
    version: initialData?.version || 1,
    ...(initialData?.id && { id: initialData.id }),
  });

  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictVersions, setConflictVersions] = useState<{ current: number; server: number } | null>(null);

  // Refs for scroll synchronization
  const enScrollRef = useRef<HTMLDivElement>(null);
  const arScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<{ en: boolean; ar: boolean }>({ en: false, ar: false });

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize TipTap editors with bilingual support
  const editorEn = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude link from StarterKit to avoid duplicate
        link: false,
      }),
      Placeholder.configure({
        placeholder: t('positions.editor.placeholderEn'),
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: formData.content_en,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData((prev) => ({ ...prev, content_en: html }));
      setIsDirty(true);
      scheduleAutoSave();
    },
  });

  const editorAr = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude link from StarterKit to avoid duplicate
        link: false,
      }),
      Placeholder.configure({
        placeholder: t('positions.editor.placeholderAr'),
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: formData.content_ar,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData((prev) => ({ ...prev, content_ar: html }));
      setIsDirty(true);
      scheduleAutoSave();
    },
  });

  // Schedule auto-save with debouncing
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, autoSaveInterval);
  }, [autoSaveInterval]);

  // Auto-save handler
  const handleAutoSave = async () => {
    if (!isDirty || readOnly || saving) return;

    setAutoSaving(true);
    try {
      await onSave(formData);
      setIsDirty(false);
      setLastSaved(new Date());
      setError(null);
    } catch (err: any) {
      // Check for version conflict (409)
      if (err.status === 409 || err.message?.includes('version') || err.message?.includes('conflict')) {
        const serverVersion = err.serverVersion || formData.version + 1;
        setConflictVersions({ current: formData.version, server: serverVersion });
        setShowConflictDialog(true);
        if (onConflict) {
          onConflict(formData.version, serverVersion);
        }
      } else {
        setError(err.message || t('positions.editor.autoSaveError'));
      }
    } finally {
      setAutoSaving(false);
    }
  };

  // Manual save handler
  const handleManualSave = async () => {
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      setIsDirty(false);
      setLastSaved(new Date());
      setFormData((prev) => ({ ...prev, version: prev.version + 1 }));
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('version') || err.message?.includes('conflict')) {
        const serverVersion = err.serverVersion || formData.version + 1;
        setConflictVersions({ current: formData.version, server: serverVersion });
        setShowConflictDialog(true);
        if (onConflict) {
          onConflict(formData.version, serverVersion);
        }
      } else {
        setError(err.message || t('positions.editor.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, saving]);

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Synchronized scroll handler
  const handleScroll = (source: 'en' | 'ar') => (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPercentage = target.scrollTop / (target.scrollHeight - target.clientHeight);

    if (isScrollingRef.current[source]) return;

    isScrollingRef.current[source] = true;
    const otherRef = source === 'en' ? arScrollRef : enScrollRef;
    const otherSource = source === 'en' ? 'ar' : 'en';

    if (otherRef.current) {
      const otherScrollTop = scrollPercentage * (otherRef.current.scrollHeight - otherRef.current.clientHeight);
      otherRef.current.scrollTop = otherScrollTop;
    }

    setTimeout(() => {
      isScrollingRef.current[otherSource] = false;
    }, 100);
  };

  // Handle conflict resolution - reload
  const handleConflictReload = () => {
    setShowConflictDialog(false);
    window.location.reload();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Save status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {autoSaving && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('positions.editor.autoSaving')}
            </Badge>
          )}
          {!autoSaving && lastSaved && (
            <Badge variant="outline">
              {t('positions.editor.lastSaved', { time: lastSaved.toLocaleTimeString() })}
            </Badge>
          )}
          {isDirty && !autoSaving && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {t('positions.editor.unsavedChanges')}
            </Badge>
          )}
        </div>
        <Button
          onClick={handleManualSave}
          disabled={saving || !isDirty || readOnly}
          className="gap-2"
          aria-label={t('positions.editor.save')}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('positions.editor.save')}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bilingual side-by-side editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t('positions.editor.englishContent')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="title_en">{t('positions.editor.title')}</Label>
              <input
                id="title_en"
                type="text"
                value={formData.title_en}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title_en: e.target.value }));
                  setIsDirty(true);
                  scheduleAutoSave();
                }}
                readOnly={readOnly}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  readOnly && 'bg-gray-100 cursor-not-allowed'
                )}
                aria-label={t('positions.editor.titleEnglish')}
              />
            </div>
            <div>
              <Label>{t('positions.editor.content')}</Label>
              <div
                className="border border-gray-300 rounded-md overflow-hidden"
                dir="ltr"
              >
                <EditorMenuBar editor={editorEn} disabled={readOnly} />
                <div
                  ref={enScrollRef}
                  onScroll={handleScroll('en')}
                  className="h-96 overflow-y-auto"
                >
                  <EditorContent
                    editor={editorEn}
                    className="prose prose-sm max-w-none p-4 focus:outline-none"
                    aria-label={t('positions.editor.contentEnglish')}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arabic Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t('positions.editor.arabicContent')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="title_ar">{t('positions.editor.title')}</Label>
              <input
                id="title_ar"
                type="text"
                value={formData.title_ar}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title_ar: e.target.value }));
                  setIsDirty(true);
                  scheduleAutoSave();
                }}
                readOnly={readOnly}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  readOnly && 'bg-gray-100 cursor-not-allowed'
                )}
                dir="rtl"
                aria-label={t('positions.editor.titleArabic')}
              />
            </div>
            <div>
              <Label>{t('positions.editor.content')}</Label>
              <div
                className="border border-gray-300 rounded-md overflow-hidden"
                dir="rtl"
              >
                <EditorMenuBar editor={editorAr} disabled={readOnly} />
                <div
                  ref={arScrollRef}
                  onScroll={handleScroll('ar')}
                  className="h-96 overflow-y-auto"
                >
                  <EditorContent
                    editor={editorAr}
                    className="prose prose-sm max-w-none p-4 focus:outline-none"
                    aria-label={t('positions.editor.contentArabic')}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Conflict Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              {t('positions.editor.conflictTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('positions.editor.conflictDescription', {
                current: conflictVersions?.current,
                server: conflictVersions?.server,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConflictReload} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('positions.editor.reloadPage')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
