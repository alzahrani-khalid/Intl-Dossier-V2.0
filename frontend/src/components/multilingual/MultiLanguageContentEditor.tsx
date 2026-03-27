/**
 * MultiLanguageContentEditor Component
 * Feature: Multi-language content authoring and storage
 *
 * Editor for managing content in multiple languages with RTL support
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Languages, Check, AlertCircle, Loader2, Star, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { ContentLanguageTabs, LanguageDropdownMenu } from './ContentLanguageSelector'
import { useMultiLangContent, useSupportedLanguages } from '@/hooks/useMultiLangContent'
import type {
  ContentLanguage,
  MultiLanguageContentEditorProps,
  MultiLangFieldConfig,
  TranslationCompleteness,
} from '@/types/multilingual-content.types'
import {
  LANGUAGE_METADATA,
  UN_OFFICIAL_LANGUAGES,
  isRTLLanguage,
  calculateCompleteness,
} from '@/types/multilingual-content.types'

/**
 * Field editor component for a single language
 */
interface FieldEditorProps {
  field: MultiLangFieldConfig
  value: string
  onChange: (value: string) => void
  language: ContentLanguage
  disabled?: boolean
  showTranslateButton?: boolean
  onTranslate?: () => void
  isTranslating?: boolean
}

function FieldEditor({
  field,
  value,
  onChange,
  language,
  disabled = false,
  showTranslateButton = false,
  onTranslate,
  isTranslating = false,
}: FieldEditorProps) {
  const { t } = useTranslation('multilingual')
  const isRTLLang = isRTLLanguage(language)

  const commonProps = {
    id: `${field.fieldName}-${language}`,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    placeholder: field.placeholderKey ? t(field.placeholderKey) : undefined,
    disabled,
    dir: isRTLLang ? 'rtl' : 'ltr',
    className: cn('w-full', isRTLLang && 'text-end'),
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${field.fieldName}-${language}`} className="flex items-center gap-1.5">
          <span>{t(field.labelKey)}</span>
          {field.required && <span className="text-destructive">*</span>}
        </Label>
        {showTranslateButton && onTranslate && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onTranslate}
                  disabled={disabled || isTranslating}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {isTranslating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>{t('translate')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('translateFieldTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {field.type === 'textarea' ? (
        <Textarea {...commonProps} rows={field.rows || 4} />
      ) : (
        <Input {...commonProps} />
      )}
    </div>
  )
}

/**
 * Completeness indicator for a language
 */
interface CompletenessIndicatorProps {
  completeness: TranslationCompleteness
  className?: string
}

function CompletenessIndicator({ completeness, className }: CompletenessIndicatorProps) {
  const meta = LANGUAGE_METADATA[completeness.language]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm">{meta.flag_emoji}</span>
      <Progress value={completeness.percentage} className="h-2 w-16 sm:w-24" />
      <span className="text-xs text-muted-foreground">{completeness.percentage}%</span>
    </div>
  )
}

/**
 * Main MultiLanguageContentEditor component
 */
export function MultiLanguageContentEditor({
  entityType,
  entityId,
  fields,
  onChange,
  onSave,
  showTranslateButtons = true,
  showCompletenessIndicator = true,
  readOnly = false,
  className,
}: MultiLanguageContentEditorProps) {
  const { t } = useTranslation('multilingual')
  // State
  const [selectedLanguage, setSelectedLanguage] = useState<ContentLanguage>('en')
  const [localContent, setLocalContent] = useState<Record<string, Record<ContentLanguage, string>>>(
    {},
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [translatingField] = useState<string | null>(null)

  // Hooks
  const {
    data: rawData,
    isLoading,
    error,
  } = useMultiLangContent(entityType, entityId)

  const { data: _supportedLanguages } = useSupportedLanguages()

  // Extract translations and available languages from query response with safe defaults
  const queryResult = rawData as {
    translations?: Array<{ field_name: string; language: ContentLanguage; content: string }>
    available_languages?: Array<{ language: ContentLanguage }>
    settings?: Record<string, unknown>
  } | undefined
  const translations = queryResult?.translations ?? []
  const availableLanguages = queryResult?.available_languages ?? []
  const settings = queryResult?.settings ?? {}
  const isUpdating = false
  const isTranslating = false

  // Initialize local content from translations
  useEffect(() => {
    if (translations.length > 0) {
      const content: Record<string, Record<ContentLanguage, string>> = {}
      translations.forEach((tr) => {
        if (!content[tr.field_name]) {
          content[tr.field_name] = {} as Record<ContentLanguage, string>
        }
        content[tr.field_name]![tr.language] = tr.content
      })
      setLocalContent(content)
    }
  }, [translations])

  // Get languages with content
  const activeLanguages = useMemo(() => {
    if (availableLanguages.length > 0) {
      return availableLanguages.map((l) => l.language)
    }
    // Default to AR/EN if no languages set
    return ['ar', 'en'] as ContentLanguage[]
  }, [availableLanguages])

  // Calculate completeness for each language
  const completenessData = useMemo((): TranslationCompleteness[] => {
    const requiredFields = fields.filter((f) => f.required).map((f) => f.fieldName)
    return calculateCompleteness(translations as Parameters<typeof calculateCompleteness>[0], requiredFields, activeLanguages) as TranslationCompleteness[]
  }, [translations, fields, activeLanguages])

  // Handle local content change
  const handleContentChange = useCallback(
    (fieldName: string, language: ContentLanguage, value: string) => {
      setLocalContent((prev) => {
        const updated: Record<string, Record<ContentLanguage, string>> = {
          ...prev,
          [fieldName]: {
            ...((prev[fieldName] || {}) as Record<ContentLanguage, string>),
            [language]: value,
          } as Record<ContentLanguage, string>,
        }
        return updated
      })
      setHasUnsavedChanges(true)
      onChange?.(fieldName, language, value)
    },
    [onChange],
  )

  // Handle save
  const handleSave = useCallback(async () => {
    setHasUnsavedChanges(false)
    onSave?.()
  }, [onSave])

  // Handle translation (stub — translateField API no longer available)
  const handleTranslate = useCallback(
    async (_fieldName: string, _targetLanguage: ContentLanguage) => {
      // Translation API removed during refactoring
    },
    [],
  )

  // Handle add language (local-only stub)
  const handleAddLanguage = useCallback(
    async (language: ContentLanguage) => {
      setSelectedLanguage(language)
    },
    [],
  )

  // Handle remove language (local-only stub)
  const handleRemoveLanguage = useCallback(
    async (language: ContentLanguage) => {
      if (selectedLanguage === language) {
        setSelectedLanguage(activeLanguages[0] || 'en')
      }
    },
    [selectedLanguage, activeLanguages],
  )

  // Get content for field/language
  const getFieldContent = useCallback(
    (fieldName: string, language: ContentLanguage): string => {
      return localContent[fieldName]?.[language] || ''
    },
    [localContent],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span>{t('multiLanguageContent')}</span>
            </CardTitle>
            <CardDescription>{t('multiLanguageContentDescription')}</CardDescription>
          </div>
          {!readOnly && hasUnsavedChanges && (
            <Button onClick={handleSave} disabled={isUpdating} size="sm">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Check className="h-4 w-4 me-2" />
              )}
              {t('saveChanges')}
            </Button>
          )}
        </div>

        {/* Completeness indicators */}
        {Boolean(showCompletenessIndicator) && completenessData.length > 0
          ? <div className="flex flex-wrap gap-4">
              {completenessData.map((cd) => (
                <CompletenessIndicator key={cd.language} completeness={cd} />
              ))}
            </div>
          : null}

        {/* Error display */}
        {error != null ? (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{(error as Error).message ?? String(error)}</span>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Language tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <ContentLanguageTabs
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            availableLanguages={activeLanguages}
            showFlag
            showNativeName={false}
          />

          {!readOnly && (
            <div className="flex items-center gap-2">
              <LanguageDropdownMenu
                availableLanguages={UN_OFFICIAL_LANGUAGES}
                selectedLanguages={activeLanguages}
                onSelectLanguage={handleAddLanguage}
              />

              {/* Remove language button */}
              {activeLanguages.length > 1 && selectedLanguage !== settings?.primary_language && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('removeLanguage')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('removeLanguageConfirm', {
                          language: LANGUAGE_METADATA[selectedLanguage].name_en,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemoveLanguage(selectedLanguage)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {t('remove')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Set as primary button */}
              {settings?.primary_language !== selectedLanguage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { /* setPrimaryLanguage stub — API removed */ }}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('setAsPrimary')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>

        {/* Primary language indicator */}
        {settings?.primary_language === selectedLanguage && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            {t('primaryLanguage')}
          </Badge>
        )}

        {/* Content fields */}
        <div className="space-y-4">
          {fields.map((field) => {
            const hasSourceContent = activeLanguages.some(
              (lang) =>
                lang !== selectedLanguage && getFieldContent(field.fieldName, lang).length > 0,
            )

            return (
              <FieldEditor
                key={`${field.fieldName}-${selectedLanguage}`}
                field={field}
                value={getFieldContent(field.fieldName, selectedLanguage)}
                onChange={(value) => handleContentChange(field.fieldName, selectedLanguage, value)}
                language={selectedLanguage}
                disabled={readOnly}
                showTranslateButton={
                  showTranslateButtons &&
                  hasSourceContent &&
                  !getFieldContent(field.fieldName, selectedLanguage)
                }
                onTranslate={() => handleTranslate(field.fieldName, selectedLanguage)}
                isTranslating={isTranslating && translatingField === field.fieldName}
              />
            )
          })}
        </div>

        {/* Quick translate all button */}
        {showTranslateButtons && !readOnly && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                for (const field of fields) {
                  if (!getFieldContent(field.fieldName, selectedLanguage)) {
                    await handleTranslate(field.fieldName, selectedLanguage)
                  }
                }
              }}
              disabled={isTranslating}
              className="gap-2"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
              {t('translateAllMissing')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
