/**
 * Geographic Visualization Types
 * Feature: geographic-visualization
 *
 * Type definitions for the interactive world map visualization including:
 * - Country coordinates and geographic data
 * - Engagement activity heatmaps
 * - Relationship flows between countries
 * - Regional groupings and filtering
 */

import type { TimeRange, DateRange } from './analytics.types'
import type { DossierRelationshipType, RelationshipStatus } from './relationship.types'
import type { EngagementType, EngagementStatus } from './engagement.types'

// ============================================================================
// Geographic Coordinate Types
// ============================================================================

/**
 * Geographic coordinates for a location
 */
export interface GeoCoordinates {
  lat: number
  lng: number
}

/**
 * Country with geographic data for map visualization
 */
export interface CountryGeoData {
  id: string
  iso_code_2: string
  iso_code_3: string
  name_en: string
  name_ar: string
  region: CountryRegion
  sub_region?: string
  coordinates: GeoCoordinates
  capital_en?: string
  capital_ar?: string
}

/**
 * Regional classification for countries
 */
export type CountryRegion = 'africa' | 'americas' | 'asia' | 'europe' | 'oceania'

/**
 * Regional grouping for filtering
 */
export interface RegionalGroup {
  id: string
  name_en: string
  name_ar: string
  region: CountryRegion
  countries: string[] // ISO codes
  color: string
}

// ============================================================================
// Engagement Heatmap Types
// ============================================================================

/**
 * Engagement intensity level for heatmap visualization
 */
export type EngagementIntensity = 'none' | 'low' | 'medium' | 'high' | 'very_high'

/**
 * Country engagement metrics for heatmap
 */
export interface CountryEngagementMetrics {
  countryId: string
  iso_code_2: string
  name_en: string
  name_ar: string
  coordinates: GeoCoordinates
  totalEngagements: number
  engagementsByType: Record<EngagementType, number>
  engagementsByStatus: Record<EngagementStatus, number>
  intensity: EngagementIntensity
  intensityScore: number // 0-100 normalized score
  recentEngagements: number // last 30 days
  upcomingEngagements: number // next 30 days
  lastEngagementDate?: string
  nextEngagementDate?: string
}

/**
 * Heatmap configuration
 */
export interface HeatmapConfig {
  metric: 'total' | 'recent' | 'upcoming' | 'intensity'
  colorScale: string[] // gradient colors from low to high
  showLabels: boolean
  showValues: boolean
  minRadius: number
  maxRadius: number
}

// ============================================================================
// Relationship Flow Types
// ============================================================================

/**
 * Relationship flow between two countries/entities
 */
export interface RelationshipFlow {
  id: string
  source: {
    countryId: string
    iso_code_2: string
    name_en: string
    name_ar: string
    coordinates: GeoCoordinates
  }
  target: {
    countryId: string
    iso_code_2: string
    name_en: string
    name_ar: string
    coordinates: GeoCoordinates
  }
  relationshipType: DossierRelationshipType
  relationshipStatus: RelationshipStatus
  strength: number // 1-10 strength indicator
  engagementCount: number
  metadata?: Record<string, unknown>
}

/**
 * Map connection for animated lines
 */
export interface MapConnection {
  start: GeoCoordinates & { label?: string }
  end: GeoCoordinates & { label?: string }
  color?: string
  strength?: number
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Geographic visualization filter state
 */
export interface GeoVisualizationFilters {
  timeRange: TimeRange
  customDateRange?: DateRange
  relationshipTypes: DossierRelationshipType[]
  engagementTypes: EngagementType[]
  regions: CountryRegion[]
  countries: string[] // ISO codes
  intensityThreshold: EngagementIntensity
  showRelationshipFlows: boolean
  showEngagementHeatmap: boolean
  showRegionalGroupings: boolean
}

/**
 * Default filter values
 */
export const DEFAULT_GEO_FILTERS: GeoVisualizationFilters = {
  timeRange: '90d',
  relationshipTypes: [],
  engagementTypes: [],
  regions: [],
  countries: [],
  intensityThreshold: 'none',
  showRelationshipFlows: true,
  showEngagementHeatmap: true,
  showRegionalGroupings: false,
}

// ============================================================================
// Map View Types
// ============================================================================

/**
 * Map view mode
 */
export type MapViewMode = 'relationships' | 'engagements' | 'combined' | 'regional'

/**
 * Map marker type
 */
export interface MapMarker {
  id: string
  coordinates: GeoCoordinates
  type: 'country' | 'organization' | 'engagement'
  label_en: string
  label_ar: string
  size: 'small' | 'medium' | 'large'
  color: string
  data: CountryEngagementMetrics | Record<string, unknown>
}

/**
 * Map tooltip content
 */
export interface MapTooltipContent {
  title_en: string
  title_ar: string
  subtitle_en?: string
  subtitle_ar?: string
  metrics: {
    label_en: string
    label_ar: string
    value: number | string
    color?: string
  }[]
  actions?: {
    label_en: string
    label_ar: string
    action: string
  }[]
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Geographic visualization API request
 */
export interface GeoVisualizationRequest {
  endpoint: 'countries' | 'engagements' | 'relationships' | 'summary'
  filters: Partial<GeoVisualizationFilters>
}

/**
 * Geographic summary response
 */
export interface GeoVisualizationSummary {
  totalCountries: number
  countriesWithEngagements: number
  totalEngagements: number
  totalRelationships: number
  topCountries: {
    country: CountryGeoData
    engagementCount: number
    relationshipCount: number
  }[]
  regionBreakdown: {
    region: CountryRegion
    countryCount: number
    engagementCount: number
    relationshipCount: number
  }[]
  intensityDistribution: Record<EngagementIntensity, number>
}

/**
 * Geographic data API response
 */
export interface GeoVisualizationResponse {
  success: true
  data: {
    countries?: CountryGeoData[]
    engagementMetrics?: CountryEngagementMetrics[]
    relationships?: RelationshipFlow[]
    summary?: GeoVisualizationSummary
    connections?: MapConnection[]
    generatedAt: string
    timeRange: {
      start: string
      end: string
      label: string
    }
  }
}

/**
 * Error response
 */
export interface GeoVisualizationErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export type GeoVisualizationApiResponse = GeoVisualizationResponse | GeoVisualizationErrorResponse

// ============================================================================
// Country Coordinates Reference
// ============================================================================

/**
 * Pre-defined coordinates for common countries
 * Used when database doesn't have coordinates
 */
export const COUNTRY_COORDINATES: Record<string, GeoCoordinates> = {
  // Middle East & Gulf
  SA: { lat: 24.7136, lng: 46.6753 }, // Saudi Arabia (Riyadh)
  AE: { lat: 24.4539, lng: 54.3773 }, // UAE (Abu Dhabi)
  KW: { lat: 29.3759, lng: 47.9774 }, // Kuwait
  QA: { lat: 25.2854, lng: 51.531 }, // Qatar (Doha)
  BH: { lat: 26.2285, lng: 50.586 }, // Bahrain
  OM: { lat: 23.588, lng: 58.3829 }, // Oman (Muscat)
  // North Africa
  EG: { lat: 30.0444, lng: 31.2357 }, // Egypt (Cairo)
  // Levant
  JO: { lat: 31.9454, lng: 35.9284 }, // Jordan (Amman)
  LB: { lat: 33.8938, lng: 35.5018 }, // Lebanon (Beirut)
  SY: { lat: 33.5138, lng: 36.2765 }, // Syria (Damascus)
  IQ: { lat: 33.3152, lng: 44.3661 }, // Iraq (Baghdad)
  // North America
  US: { lat: 38.9072, lng: -77.0369 }, // USA (Washington DC)
  CA: { lat: 45.4215, lng: -75.6972 }, // Canada (Ottawa)
  // Europe
  GB: { lat: 51.5074, lng: -0.1278 }, // UK (London)
  FR: { lat: 48.8566, lng: 2.3522 }, // France (Paris)
  DE: { lat: 52.52, lng: 13.405 }, // Germany (Berlin)
  IT: { lat: 41.9028, lng: 12.4964 }, // Italy (Rome)
  ES: { lat: 40.4168, lng: -3.7038 }, // Spain (Madrid)
  NL: { lat: 52.3676, lng: 4.9041 }, // Netherlands (Amsterdam)
  BE: { lat: 50.8503, lng: 4.3517 }, // Belgium (Brussels)
  CH: { lat: 46.9481, lng: 7.4474 }, // Switzerland (Bern)
  // Asia
  CN: { lat: 39.9042, lng: 116.4074 }, // China (Beijing)
  JP: { lat: 35.6762, lng: 139.6503 }, // Japan (Tokyo)
  KR: { lat: 37.5665, lng: 126.978 }, // South Korea (Seoul)
  IN: { lat: 28.6139, lng: 77.209 }, // India (New Delhi)
  SG: { lat: 1.3521, lng: 103.8198 }, // Singapore
  MY: { lat: 3.139, lng: 101.6869 }, // Malaysia (Kuala Lumpur)
  ID: { lat: -6.2088, lng: 106.8456 }, // Indonesia (Jakarta)
  TH: { lat: 13.7563, lng: 100.5018 }, // Thailand (Bangkok)
  PK: { lat: 33.6844, lng: 73.0479 }, // Pakistan (Islamabad)
  // Africa
  ZA: { lat: -25.7461, lng: 28.1881 }, // South Africa (Pretoria)
  NG: { lat: 9.0765, lng: 7.3986 }, // Nigeria (Abuja)
  KE: { lat: -1.2921, lng: 36.8219 }, // Kenya (Nairobi)
  MA: { lat: 34.0209, lng: -6.8416 }, // Morocco (Rabat)
  TN: { lat: 36.8065, lng: 10.1815 }, // Tunisia (Tunis)
  DZ: { lat: 36.7538, lng: 3.0588 }, // Algeria (Algiers)
  // South America
  BR: { lat: -15.826, lng: -47.9218 }, // Brazil (Brasília)
  AR: { lat: -34.6037, lng: -58.3816 }, // Argentina (Buenos Aires)
  // Oceania
  AU: { lat: -35.2809, lng: 149.13 }, // Australia (Canberra)
  NZ: { lat: -41.2866, lng: 174.7756 }, // New Zealand (Wellington)
}

// ============================================================================
// Intensity Calculation Helpers
// ============================================================================

/**
 * Calculate engagement intensity from count
 */
export function calculateIntensity(count: number, maxCount: number): EngagementIntensity {
  if (count === 0) return 'none'
  const ratio = count / Math.max(maxCount, 1)
  if (ratio >= 0.8) return 'very_high'
  if (ratio >= 0.5) return 'high'
  if (ratio >= 0.25) return 'medium'
  return 'low'
}

/**
 * Calculate intensity score (0-100)
 */
export function calculateIntensityScore(count: number, maxCount: number): number {
  if (maxCount === 0) return 0
  return Math.min(100, Math.round((count / maxCount) * 100))
}

/**
 * Get color for intensity level
 */
export const INTENSITY_COLORS: Record<EngagementIntensity, string> = {
  none: '#E5E7EB', // gray-200
  low: '#93C5FD', // blue-300
  medium: '#3B82F6', // blue-500
  high: '#1D4ED8', // blue-700
  very_high: '#1E3A8A', // blue-900
}

/**
 * Get region colors for map
 */
export const REGION_COLORS: Record<CountryRegion, string> = {
  africa: '#F59E0B', // amber-500
  americas: '#10B981', // emerald-500
  asia: '#3B82F6', // blue-500
  europe: '#8B5CF6', // violet-500
  oceania: '#EC4899', // pink-500
}

// ============================================================================
// Labels
// ============================================================================

/**
 * Labels for intensity levels
 */
export const INTENSITY_LABELS: Record<EngagementIntensity, { en: string; ar: string }> = {
  none: { en: 'No Activity', ar: 'لا يوجد نشاط' },
  low: { en: 'Low Activity', ar: 'نشاط منخفض' },
  medium: { en: 'Medium Activity', ar: 'نشاط متوسط' },
  high: { en: 'High Activity', ar: 'نشاط عالي' },
  very_high: { en: 'Very High Activity', ar: 'نشاط عالي جداً' },
}

/**
 * Labels for regions
 */
export const REGION_LABELS: Record<CountryRegion, { en: string; ar: string }> = {
  africa: { en: 'Africa', ar: 'أفريقيا' },
  americas: { en: 'Americas', ar: 'الأمريكتان' },
  asia: { en: 'Asia', ar: 'آسيا' },
  europe: { en: 'Europe', ar: 'أوروبا' },
  oceania: { en: 'Oceania', ar: 'أوقيانوسيا' },
}

/**
 * Labels for map view modes
 */
export const VIEW_MODE_LABELS: Record<MapViewMode, { en: string; ar: string }> = {
  relationships: { en: 'Relationships', ar: 'العلاقات' },
  engagements: { en: 'Engagements', ar: 'الارتباطات' },
  combined: { en: 'Combined View', ar: 'العرض المدمج' },
  regional: { en: 'Regional Groups', ar: 'المجموعات الإقليمية' },
}
