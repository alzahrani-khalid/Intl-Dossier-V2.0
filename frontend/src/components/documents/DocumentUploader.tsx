// T051: DocumentUploader component
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocuments } from '@/hooks/useDocuments'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, File, X, FileText } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface DocumentUploaderProps {
  ownerType: string
  ownerId: string
  onUploadComplete?: () => void
}

export function DocumentUploader({ ownerType, ownerId, onUploadComplete }: DocumentUploaderProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { documents, isLoading, error } = useDocuments({ owner_type: ownerType, owner_id: ownerId })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setTitleEn(nameWithoutExt)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 1. Upload file to Supabase Storage
      const timestamp = Date.now()
      const fileName = `${ownerType}/${ownerId}/${timestamp}_${selectedFile.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress(50)

      // 2. Create document record via Edge Function
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/documents-create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: ownerType,
          owner_id: ownerId,
          document_type: documentType,
          title_en: titleEn || selectedFile.name,
          title_ar: titleAr,
          storage_path: uploadData.path,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create document record')
      }

      setUploadProgress(100)

      // Reset form
      setSelectedFile(null)
      setDocumentType('')
      setTitleEn('')
      setTitleAr('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh documents list
      queryClient.invalidateQueries({
        queryKey: ['documents', { owner_type: ownerType, owner_id: ownerId }],
      })

      // Call onUploadComplete callback if provided
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert(t('documents.upload_failed'))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (documentId: string, storagePath: string) => {
    if (!confirm(t('documents.confirm_delete'))) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/documents-delete?documentId=${documentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete document')
      }

      // Refresh documents list
      queryClient.invalidateQueries({
        queryKey: ['documents', { owner_type: ownerType, owner_id: ownerId }],
      })
    } catch (err) {
      console.error('Delete failed:', err)
      alert(t('documents.delete_failed'))
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive">{t('errors.failed_to_load')}</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Upload Form */}
      <Card className="p-4">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('documents.upload_document')}
        </h3>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t('documents.file')}</label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t('documents.document_type')}</label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.select_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mou">{t('documents.types.mou')}</SelectItem>
                  <SelectItem value="report">{t('documents.types.report')}</SelectItem>
                  <SelectItem value="contract">{t('documents.types.contract')}</SelectItem>
                  <SelectItem value="other">{t('documents.types.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t('documents.title_en')}</label>
              <Input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder={t('documents.title_en_placeholder')}
                disabled={isUploading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{t('documents.title_ar')}</label>
              <Input
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={t('documents.title_ar_placeholder')}
                disabled={isUploading}
              />
            </div>
          </div>

          {isUploading && (
            <div className="flex flex-col gap-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress}% {t('documents.uploading')}
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || isUploading}
            className="w-full sm:w-auto sm:self-end"
          >
            {isUploading ? t('documents.uploading') : t('documents.upload')}
          </Button>
        </div>
      </Card>

      {/* Documents List */}
      <div className="grid grid-cols-1 gap-2">
        {documents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t('documents.no_documents')}</p>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-sm sm:text-base truncate">
                        {isRTL ? doc.title_ar || doc.title_en : doc.title_en || doc.title_ar}
                      </h4>
                      <Badge variant="outline" className="shrink-0">
                        {t(`documents.types.${doc.document_type}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : ''} •{' '}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
