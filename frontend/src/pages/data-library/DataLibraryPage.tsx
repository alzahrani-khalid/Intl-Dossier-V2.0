import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Upload, FileText, Image, Video, Database, Download, Trash2, Tag, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface DataLibraryItem {
 id: string
 title_en: string
 title_ar: string
 description_en: string
 description_ar: string
 file_url: string
 file_type: string
 file_size_bytes: number
 mime_type: string
 category: string
 tags: string[]
 is_public: boolean
 download_count: number
 uploaded_by: {
 full_name: string
 }
 created_at: string
}

interface UploadProgress {
 fileName: string
 progress: number
 status: 'uploading' | 'completed' | 'error'
 error?: string
}

export function DataLibraryPage() {
 const { t, i18n } = useTranslation()
 const [searchTerm, setSearchTerm] = useState('')
 const [filterCategory, setFilterCategory] = useState<string>('all')
 const [dragActive, setDragActive] = useState(false)
 const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
 const [selectedTags, setSelectedTags] = useState<string[]>([])
 const isRTL = i18n.language === 'ar'

 const { data: items, isLoading, refetch } = useQuery({
 queryKey: ['data-library', searchTerm, filterCategory, selectedTags],
 queryFn: async () => {
 let query = supabase
 .from('data_library_items')
 .select(`
 *,
 uploaded_by:users!uploaded_by(full_name)
 `)
 .order('created_at', { ascending: false })

 if (searchTerm) {
 query = query.or(
 `title_en.ilike.%${searchTerm}%,title_ar.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%,description_ar.ilike.%${searchTerm}%`
 )
 }

 if (filterCategory !== 'all') {
 query = query.eq('category', filterCategory)
 }

 if (selectedTags.length > 0) {
 query = query.contains('tags', selectedTags)
 }

 const { data, error } = await query

 if (error) throw error
 return data as DataLibraryItem[]
 }
 })

 const uploadMutation = useMutation({
 mutationFn: async (file: File) => {
 const fileName = `${Date.now()}-${file.name}`
 const fileId = crypto.randomUUID()

 setUploadProgress(prev => ({
 ...prev,
 [fileId]: {
 fileName: file.name,
 progress: 0,
 status: 'uploading'
 }
 }))

 // Upload to Supabase Storage
 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('data-library')
 .upload(fileName, file, {
 onUploadProgress: (progress) => {
 const percentage = (progress.loaded / progress.total) * 100
 setUploadProgress(prev => ({
 ...prev,
 [fileId]: {
 ...prev[fileId],
 progress: percentage
 }
 }))
 }
 })

 if (uploadError) {
 setUploadProgress(prev => ({
 ...prev,
 [fileId]: {
 ...prev[fileId],
 status: 'error',
 error: uploadError.message
 }
 }))
 throw uploadError
 }

 // Get public URL
 const { data: { publicUrl } } = supabase.storage
 .from('data-library')
 .getPublicUrl(fileName)

 // Create database record
 const { error: dbError } = await supabase
 .from('data_library_items')
 .insert({
 title_en: file.name.split('.')[0],
 title_ar: file.name.split('.')[0],
 file_url: publicUrl,
 file_type: file.name.split('.').pop() || 'unknown',
 file_size_bytes: file.size,
 mime_type: file.type,
 category: getCategoryFromMimeType(file.type),
 tags: [],
 is_public: false
 })

 if (dbError) {
 setUploadProgress(prev => ({
 ...prev,
 [fileId]: {
 ...prev[fileId],
 status: 'error',
 error: dbError.message
 }
 }))
 throw dbError
 }

 setUploadProgress(prev => ({
 ...prev,
 [fileId]: {
 ...prev[fileId],
 progress: 100,
 status: 'completed'
 }
 }))

 return fileId
 },
 onSuccess: () => {
 refetch()
 // Clear completed uploads after 3 seconds
 setTimeout(() => {
 setUploadProgress(prev => {
 const newProgress = { ...prev }
 Object.keys(newProgress).forEach(key => {
 if (newProgress[key].status === 'completed') {
 delete newProgress[key]
 }
 })
 return newProgress
 })
 }, 3000)
 }
 })

 const getCategoryFromMimeType = (mimeType: string): string => {
 if (mimeType.startsWith('image/')) return 'image'
 if (mimeType.startsWith('video/')) return 'video'
 if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'dataset'
 if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
 return 'other'
 }

 const formatFileSize = (bytes: number): string => {
 if (bytes < 1024) return `${bytes} B`
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
 }

 const getCategoryIcon = (category: string) => {
 switch (category) {
 case 'document': return <FileText className="h-5 w-5" />
 case 'dataset': return <Database className="h-5 w-5" />
 case 'image': return <Image className="h-5 w-5" />
 case 'video': return <Video className="h-5 w-5" />
 default: return <FileText className="h-5 w-5" />
 }
 }

 const handleDrag = useCallback((e: React.DragEvent) => {
 e.preventDefault()
 e.stopPropagation()
 if (e.type === 'dragenter' || e.type === 'dragover') {
 setDragActive(true)
 } else if (e.type === 'dragleave') {
 setDragActive(false)
 }
 }, [])

 const handleDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault()
 e.stopPropagation()
 setDragActive(false)

 const files = Array.from(e.dataTransfer.files)
 files.forEach(file => {
 if (file.size > 50 * 1024 * 1024) {
 alert(t('dataLibrary.fileTooLarge'))
 return
 }
 uploadMutation.mutate(file)
 })
 }, [uploadMutation, t])

 const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || [])
 files.forEach(file => {
 if (file.size > 50 * 1024 * 1024) {
 alert(t('dataLibrary.fileTooLarge'))
 return
 }
 uploadMutation.mutate(file)
 })
 }

 const categories = ['all', 'document', 'dataset', 'image', 'video', 'other']

 // Extract all unique tags from items
 const allTags = Array.from(new Set(items?.flatMap(item => item.tags) || []))

 return (
 <div className="container mx-auto py-6">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold">{t('navigation.dataLibrary')}</h1>
 </div>

 {/* Upload Area */}
 <Card className="mb-6">
 <CardContent className="p-6">
 <div
 className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
 dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
 }`}
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 >
 <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
 <p className="text-lg font-medium mb-2">{t('dataLibrary.dragDropFiles')}</p>
 <p className="text-sm text-muted-foreground mb-4">{t('dataLibrary.or')}</p>
 <label>
 <input
 type="file"
 multiple
 className="hidden"
 onChange={handleFileInput}
 accept="*/*"
 />
 <Button variant="outline" asChild>
 <span>{t('dataLibrary.browseFiles')}</span>
 </Button>
 </label>
 <p className="text-xs text-muted-foreground mt-4">
 {t('dataLibrary.maxFileSize')}: 50MB
 </p>
 </div>

 {/* Upload Progress */}
 {Object.keys(uploadProgress).length > 0 && (
 <div className="mt-4 space-y-2">
 {Object.entries(uploadProgress).map(([id, progress]) => (
 <div key={id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
 <FileText className="h-5 w-5 text-muted-foreground" />
 <div className="flex-1">
 <div className="flex justify-between mb-1">
 <span className="text-sm font-medium">{progress.fileName}</span>
 <span className="text-sm text-muted-foreground">
 {progress.status === 'uploading' && `${Math.round(progress.progress)}%`}
 {progress.status === 'completed' && t('common.completed')}
 {progress.status === 'error' && t('common.error')}
 </span>
 </div>
 <Progress value={progress.progress} className="h-2" />
 {progress.error && (
 <p className="text-xs text-red-600 mt-1">{progress.error}</p>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Stats */}
 <div className="grid gap-4 md:grid-cols-5 mb-6">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">{t('dataLibrary.totalFiles')}</CardTitle>
 <FileText className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{items?.length || 0}</div>
 </CardContent>
 </Card>
 {categories.slice(1).map(cat => (
 <Card key={cat}>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">{t(`dataLibrary.categories.${cat}`)}</CardTitle>
 {getCategoryIcon(cat)}
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {items?.filter(item => item.category === cat).length || 0}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* Filters */}
 <Card className="mb-6">
 <CardHeader>
 <CardTitle>{t('common.filter')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div className="flex gap-4">
 <div className="flex-1">
 <Input
 placeholder={t('dataLibrary.searchPlaceholder')}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full"
 />
 </div>
 </div>
 <div className="flex gap-2">
 <span className="text-sm text-muted-foreground mt-2">{t('dataLibrary.category')}:</span>
 {categories.map(cat => (
 <Button
 key={cat}
 variant={filterCategory === cat ? 'default' : 'outline'}
 size="sm"
 onClick={() => setFilterCategory(cat)}
 >
 {cat === 'all' ? t('common.all') : t(`dataLibrary.categories.${cat}`)}
 </Button>
 ))}
 </div>
 {allTags.length > 0 && (
 <div className="flex gap-2 flex-wrap">
 <span className="text-sm text-muted-foreground">{t('dataLibrary.tags')}:</span>
 {allTags.map(tag => (
 <Button
 key={tag}
 variant={selectedTags.includes(tag) ? 'default' : 'outline'}
 size="sm"
 onClick={() => {
 if (selectedTags.includes(tag)) {
 setSelectedTags(selectedTags.filter(t => t !== tag))
 } else {
 setSelectedTags([...selectedTags, tag])
 }
 }}
 >
 <Tag className="h-3 w-3 me-1" />
 {tag}
 </Button>
 ))}
 </div>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Files Grid */}
 <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
 {isLoading ? (
 <div className="col-span-full text-center py-8">{t('common.loading')}</div>
 ) : items && items.length > 0 ? (
 items.map(item => (
 <Card key={item.id} className="hover:shadow-lg transition-shadow">
 <CardContent className="p-4">
 <div className="flex items-start justify-between mb-3">
 {getCategoryIcon(item.category)}
 <div className="flex gap-1">
 <Button size="sm" variant="ghost">
 <Download className="h-4 w-4" />
 </Button>
 <Button size="sm" variant="ghost" className="text-red-600">
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </div>
 <h3 className="font-medium mb-1 line-clamp-2">
 {isRTL ? item.title_ar : item.title_en}
 </h3>
 {item.description_en && (
 <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
 {isRTL ? item.description_ar : item.description_en}
 </p>
 )}
 <div className="space-y-1 text-xs text-muted-foreground">
 <div>{formatFileSize(item.file_size_bytes)}</div>
 <div>{item.uploaded_by.full_name}</div>
 <div>{format(new Date(item.created_at), 'dd MMM yyyy')}</div>
 {item.download_count > 0 && (
 <div>{t('dataLibrary.downloads')}: {item.download_count}</div>
 )}
 </div>
 {item.tags.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-2">
 {item.tags.map((tag, i) => (
 <span key={i} className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs">
 {tag}
 </span>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 ))
 ) : (
 <div className="col-span-full text-center py-8 text-muted-foreground">
 {t('common.noData')}
 </div>
 )}
 </div>
 </div>
 )
}