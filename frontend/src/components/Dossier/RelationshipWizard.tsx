/**
 * RelationshipWizard Component
 *
 * An interactive wizard that guides users through creating their first
 * entity-to-entity relationships. Shows visual examples of how relationships
 * appear once created.
 *
 * Features:
 * - Multi-step guided flow for relationship creation
 * - Visual examples of different relationship types
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - Touch-friendly UI (44x44px min targets)
 * - Framer Motion animations
 */

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Building2,
  Users,
  Briefcase,
  Link2,
  ArrowRight,
  ArrowLeft,
  Check,
  Network,
  Handshake,
  Target,
  UserCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Play,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Types for the wizard
interface RelationshipExample {
  id: string
  sourceType: string
  targetType: string
  relationshipType: string
  sourceNameEn: string
  sourceNameAr: string
  targetNameEn: string
  targetNameAr: string
  descriptionEn: string
  descriptionAr: string
}

interface WizardStep {
  id: string
  titleKey: string
  descriptionKey: string
}

interface RelationshipWizardProps {
  /**
   * The current dossier ID
   */
  dossierId: string
  /**
   * Name of the current dossier
   */
  dossierName: string
  /**
   * Type of the current dossier
   */
  dossierType: string
  /**
   * Callback when user wants to create a relationship
   */
  onCreateRelationship: () => void
  /**
   * Callback to dismiss the wizard
   */
  onDismiss?: () => void
  /**
   * Optional CSS classes
   */
  className?: string
}

// Relationship examples to show users
const RELATIONSHIP_EXAMPLES: RelationshipExample[] = [
  {
    id: 'country-country',
    sourceType: 'country',
    targetType: 'country',
    relationshipType: 'bilateral_relation',
    sourceNameEn: 'Saudi Arabia',
    sourceNameAr: 'المملكة العربية السعودية',
    targetNameEn: 'United Arab Emirates',
    targetNameAr: 'الإمارات العربية المتحدة',
    descriptionEn:
      'Track bilateral relations, shared initiatives, and diplomatic history between countries.',
    descriptionAr: 'تتبع العلاقات الثنائية والمبادرات المشتركة والتاريخ الدبلوماسي بين الدول.',
  },
  {
    id: 'org-country',
    sourceType: 'organization',
    targetType: 'country',
    relationshipType: 'member_of',
    sourceNameEn: 'United Nations',
    sourceNameAr: 'الأمم المتحدة',
    targetNameEn: 'Saudi Arabia',
    targetNameAr: 'المملكة العربية السعودية',
    descriptionEn: 'Link organizations to their member countries or host nations.',
    descriptionAr: 'ربط المنظمات بالدول الأعضاء أو الدول المضيفة.',
  },
  {
    id: 'person-org',
    sourceType: 'person',
    targetType: 'organization',
    relationshipType: 'represents',
    sourceNameEn: 'Ambassador Ahmed',
    sourceNameAr: 'السفير أحمد',
    targetNameEn: 'Ministry of Foreign Affairs',
    targetNameAr: 'وزارة الخارجية',
    descriptionEn: 'Connect key personnel to the organizations they represent.',
    descriptionAr: 'ربط الأشخاص الرئيسيين بالمنظمات التي يمثلونها.',
  },
  {
    id: 'org-org',
    sourceType: 'organization',
    targetType: 'organization',
    relationshipType: 'cooperates_with',
    sourceNameEn: 'World Health Organization',
    sourceNameAr: 'منظمة الصحة العالمية',
    targetNameEn: 'UNICEF',
    targetNameAr: 'اليونيسف',
    descriptionEn: 'Document cooperation agreements and partnerships between organizations.',
    descriptionAr: 'توثيق اتفاقيات التعاون والشراكات بين المنظمات.',
  },
  {
    id: 'forum-country',
    sourceType: 'forum',
    targetType: 'country',
    relationshipType: 'participant_in',
    sourceNameEn: 'G20 Summit',
    sourceNameAr: 'قمة مجموعة العشرين',
    targetNameEn: 'Saudi Arabia',
    targetNameAr: 'المملكة العربية السعودية',
    descriptionEn: 'Track forum participation and country involvement in international events.',
    descriptionAr: 'تتبع المشاركة في المنتديات ومشاركة الدول في الفعاليات الدولية.',
  },
]

// Icon mapping for dossier types
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  person: UserCircle,
  engagement: Briefcase,
  working_group: Target,
  topic: Target,
}

// Color mapping for dossier types
const TYPE_COLORS: Record<string, string> = {
  country: 'bg-blue-500/10 text-blue-600 border-blue-200',
  organization: 'bg-purple-500/10 text-purple-600 border-purple-200',
  forum: 'bg-green-500/10 text-green-600 border-green-200',
  person: 'bg-teal-500/10 text-teal-600 border-teal-200',
  engagement: 'bg-orange-500/10 text-orange-600 border-orange-200',
  working_group: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  topic: 'bg-pink-500/10 text-pink-600 border-pink-200',
}

// Wizard steps
const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    titleKey: 'wizard.steps.welcome.title',
    descriptionKey: 'wizard.steps.welcome.description',
  },
  {
    id: 'examples',
    titleKey: 'wizard.steps.examples.title',
    descriptionKey: 'wizard.steps.examples.description',
  },
  {
    id: 'preview',
    titleKey: 'wizard.steps.preview.title',
    descriptionKey: 'wizard.steps.preview.description',
  },
]

/**
 * Animated connection line between two nodes
 */
function AnimatedConnection({ isRTL }: { isRTL: boolean }) {
  return (
    <div className="relative flex-1 h-12 flex items-center justify-center mx-2">
      {/* Connection line */}
      <motion.div
        className="absolute inset-y-5 start-0 end-0 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ transformOrigin: isRTL ? 'right' : 'left' }}
      />
      {/* Animated dot */}
      <motion.div
        className="absolute w-2 h-2 bg-primary rounded-full"
        initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
        animate={{
          x: [isRTL ? 50 : -50, 0, isRTL ? -50 : 50],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Arrow indicator */}
      <motion.div
        className="absolute end-0 text-primary"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </motion.div>
    </div>
  )
}

/**
 * Entity node component for visual examples
 */
function EntityNode({
  type,
  name,
  isSource,
  delay = 0,
}: {
  type: string
  name: string
  isSource?: boolean
  delay?: number
}) {
  const Icon = TYPE_ICONS[type] || Globe
  const colorClasses = TYPE_COLORS[type] || TYPE_COLORS.country

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 min-w-[100px] sm:min-w-[120px]',
        colorClasses,
        isSource && 'ring-2 ring-primary ring-offset-2',
      )}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className={cn('p-2 rounded-full', colorClasses.split(' ')[0])}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <span className="text-xs sm:text-sm font-medium text-center line-clamp-2">{name}</span>
      <Badge variant="outline" className="text-xs capitalize">
        {type.replace('_', ' ')}
      </Badge>
    </motion.div>
  )
}

/**
 * Relationship example card
 */
function RelationshipExampleCard({
  example,
  isRTL,
  isSelected,
  onClick,
}: {
  example: RelationshipExample
  isRTL: boolean
  isSelected?: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation('relationships')

  const relationshipLabel = t(`types.${example.relationshipType}`, example.relationshipType)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-start p-4 sm:p-6 rounded-xl border-2 transition-all',
        'hover:shadow-md hover:border-primary/50',
        isSelected && 'border-primary bg-primary/5 shadow-md',
        !isSelected && 'border-border bg-card',
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Visual representation */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4">
        <EntityNode
          type={example.sourceType}
          name={isRTL ? example.sourceNameAr : example.sourceNameEn}
          isSource
          delay={0}
        />
        <AnimatedConnection isRTL={isRTL} />
        <EntityNode
          type={example.targetType}
          name={isRTL ? example.targetNameAr : example.targetNameEn}
          delay={0.1}
        />
      </div>

      {/* Relationship label */}
      <div className="flex items-center justify-center mb-3">
        <Badge variant="secondary" className="px-3 py-1">
          <Link2 className="h-3 w-3 me-1" />
          {relationshipLabel}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center">
        {isRTL ? example.descriptionAr : example.descriptionEn}
      </p>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="flex items-center justify-center mt-3 text-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Check className="h-5 w-5 me-1" />
          <span className="text-sm font-medium">{t('wizard.selected')}</span>
        </motion.div>
      )}
    </motion.button>
  )
}

/**
 * Network graph preview showing how relationships look
 */
function NetworkPreview({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation('relationships')

  // Mini nodes for the preview
  const previewNodes = [
    { id: 1, x: 50, y: 40, type: 'country', label: isRTL ? 'دولة' : 'Country' },
    { id: 2, x: 150, y: 20, type: 'organization', label: isRTL ? 'منظمة' : 'Organization' },
    { id: 3, x: 250, y: 50, type: 'person', label: isRTL ? 'شخص' : 'Person' },
    { id: 4, x: 100, y: 100, type: 'forum', label: isRTL ? 'منتدى' : 'Forum' },
    { id: 5, x: 200, y: 110, type: 'engagement', label: isRTL ? 'ارتباط' : 'Engagement' },
  ]

  const previewEdges = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 1, to: 4 },
    { from: 4, to: 5 },
    { from: 2, to: 5 },
  ]

  return (
    <div className="relative w-full h-[200px] sm:h-[250px] bg-muted/30 rounded-xl border overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* SVG for edges */}
      <svg className="absolute inset-0 w-full h-full">
        {previewEdges.map((edge, idx) => {
          const fromNode = previewNodes.find((n) => n.id === edge.from)!
          const toNode = previewNodes.find((n) => n.id === edge.to)!
          return (
            <motion.line
              key={idx}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeOpacity="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            />
          )
        })}
      </svg>

      {/* Nodes */}
      {previewNodes.map((node, idx) => {
        const Icon = TYPE_ICONS[node.type] || Globe
        const colors = TYPE_COLORS[node.type] || TYPE_COLORS.country
        return (
          <motion.div
            key={node.id}
            className={cn(
              'absolute flex flex-col items-center gap-1 p-2 rounded-lg border shadow-sm',
              colors,
            )}
            style={{ left: node.x - 30, top: node.y - 20 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium whitespace-nowrap">{node.label}</span>
          </motion.div>
        )
      })}

      {/* Label */}
      <motion.div
        className="absolute bottom-3 start-3 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Network className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">{t('wizard.networkPreviewLabel')}</span>
      </motion.div>
    </div>
  )
}

/**
 * Main RelationshipWizard Component
 */
export function RelationshipWizard({
  dossierId,
  dossierName,
  dossierType,
  onCreateRelationship,
  onDismiss,
  className,
}: RelationshipWizardProps) {
  const { t, i18n } = useTranslation('relationships')
  const isRTL = i18n.language === 'ar'

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedExample, setSelectedExample] = useState<string | null>(null)

  // Get examples relevant to current dossier type
  const relevantExamples = useMemo(() => {
    return RELATIONSHIP_EXAMPLES.filter(
      (ex) => ex.sourceType === dossierType || ex.targetType === dossierType,
    ).slice(0, 3)
  }, [dossierType])

  // Use all examples if none match the current type
  const displayExamples =
    relevantExamples.length > 0 ? relevantExamples : RELATIONSHIP_EXAMPLES.slice(0, 3)

  const totalSteps = WIZARD_STEPS.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const goNext = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [isLastStep])

  const goBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [isFirstStep])

  const handleComplete = useCallback(() => {
    onCreateRelationship()
  }, [onCreateRelationship])

  const CurrentStepIcon = TYPE_ICONS[dossierType] || Globe

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
        <CardHeader className="text-center pb-4">
          {/* Dismiss button */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 end-2 h-8 w-8 p-0"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('wizard.dismiss')}</span>
            </Button>
          )}

          {/* Sparkle icon */}
          <motion.div
            className="mx-auto mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
          </motion.div>

          <CardTitle className="text-lg sm:text-xl md:text-2xl">{t('wizard.title')}</CardTitle>
          <CardDescription className="text-sm sm:text-base max-w-md mx-auto">
            {t('wizard.subtitle', { name: dossierName })}
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {WIZARD_STEPS.map((step, idx) => (
              <motion.div
                key={step.id}
                className={cn(
                  'h-2 rounded-full transition-all',
                  idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-primary/30',
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: idx === currentStep ? 1 : 0.8 }}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">
                    {t('wizard.steps.welcome.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    {t('wizard.steps.welcome.description')}
                  </p>
                </div>

                {/* Benefits list */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    {
                      icon: Network,
                      titleKey: 'wizard.benefits.visualize',
                      descKey: 'wizard.benefits.visualizeDesc',
                    },
                    {
                      icon: Target,
                      titleKey: 'wizard.benefits.track',
                      descKey: 'wizard.benefits.trackDesc',
                    },
                    {
                      icon: Handshake,
                      titleKey: 'wizard.benefits.connect',
                      descKey: 'wizard.benefits.connectDesc',
                    },
                  ].map((benefit, idx) => (
                    <motion.div
                      key={idx}
                      className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <benefit.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="text-sm font-medium mb-1">{t(benefit.titleKey)}</h4>
                      <p className="text-xs text-muted-foreground">{t(benefit.descKey)}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Current dossier indicator */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <span className="text-sm text-muted-foreground">
                    {t('wizard.currentDossier')}:
                  </span>
                  <Badge variant="outline" className="px-3 py-1">
                    <CurrentStepIcon className="h-4 w-4 me-1" />
                    {dossierName}
                  </Badge>
                </div>
              </motion.div>
            )}

            {/* Step 2: Examples */}
            {currentStep === 1 && (
              <motion.div
                key="examples"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">
                    {t('wizard.steps.examples.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    {t('wizard.steps.examples.description')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
                  {displayExamples.map((example) => (
                    <RelationshipExampleCard
                      key={example.id}
                      example={example}
                      isRTL={isRTL}
                      isSelected={selectedExample === example.id}
                      onClick={() => setSelectedExample(example.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Network Preview */}
            {currentStep === 2 && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">
                    {t('wizard.steps.preview.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    {t('wizard.steps.preview.description')}
                  </p>
                </div>

                <NetworkPreview isRTL={isRTL} />

                {/* Call to action */}
                <div className="text-center space-y-3 pt-4">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Play className="h-5 w-5" />
                    <span className="font-medium">{t('wizard.readyToStart')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('wizard.readyToStartDesc', { name: dossierName })}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              {onDismiss && (
                <Button variant="ghost" onClick={onDismiss} className="min-h-11 w-full sm:w-auto">
                  {t('wizard.skipForNow')}
                </Button>
              )}
              {!isFirstStep && (
                <Button variant="outline" onClick={goBack} className="min-h-11 w-full sm:w-auto">
                  {isRTL ? (
                    <ArrowRight className="h-4 w-4 me-2" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 me-2" />
                  )}
                  {t('wizard.back')}
                </Button>
              )}
            </div>

            <div>
              {isLastStep ? (
                <Button onClick={handleComplete} className="min-h-11 w-full sm:w-auto">
                  <Link2 className="h-4 w-4 me-2" />
                  {t('wizard.createFirstRelationship')}
                </Button>
              ) : (
                <Button onClick={goNext} className="min-h-11 w-full sm:w-auto">
                  {t('wizard.next')}
                  {isRTL ? (
                    <ArrowLeft className="h-4 w-4 ms-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 ms-2" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RelationshipWizard
