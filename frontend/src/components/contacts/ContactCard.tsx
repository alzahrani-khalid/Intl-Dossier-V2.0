/**
 * ContactCard Component
 * Part of: 027-contact-directory implementation
 *
 * Mobile-first, RTL-ready contact summary card.
 * Displays contact information with organization badge, position, and tags.
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Building2, Briefcase, Tag, Network } from 'lucide-react'
import { useRelationshipStats } from '@/hooks/useContactRelationships'
import type { Database, Json } from '@/types/contact-directory.types'
import { useDirection } from '@/hooks/useDirection'

type Contact = Database['public']['Tables']['contacts']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * Helper to safely extract a string array from a Json field
 */
function extractStringArray(json: Json | undefined | null, key: string): string[] {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return []
  const value = (json as Record<string, Json | undefined>)[key]
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

/**
 * Helper to safely extract a string from a Json field
 */
function extractString(json: Json | undefined | null, key: string): string | undefined {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return undefined
  const value = (json as Record<string, Json | undefined>)[key]
  return typeof value === 'string' ? value : undefined
}

interface ContactCardProps {
  contact: Contact & {
    organization?: Organization | null
  }
  tags?: Array<{ id: string; name: string; color?: string }>
  onClick?: () => void
  className?: string
}

const EMPTY_TAGS: Array<{ id: string; name: string; color?: string }> = []

export function ContactCard({
  contact,
  tags = EMPTY_TAGS,
  onClick,
  className = '',
}: ContactCardProps) {
const { isRTL } = useDirection()
// Get relationship stats
  const { data: relationshipStats } = useRelationshipStats(contact.id)

  // Derive full name from first_name + last_name
  const fullName = `${contact.first_name} ${contact.last_name}`.trim()

  // Extract email addresses and phone numbers from contact_info JSON
  const emailAddresses = extractStringArray(contact.contact_info, 'email_addresses')
  const phoneNumbers = extractStringArray(contact.contact_info, 'phone_numbers')
  const contactTags = extractStringArray(contact.contact_info, 'tags')

  // Get primary email and phone
  const primaryEmail = emailAddresses[0]
  const primaryPhone = phoneNumbers[0]

  // Get contact tags that match provided tags list
  const matchedTags = tags.filter((tag) => contactTags.includes(tag.id))

  // Extract position title from position JSON
  const positionTitle = extractString(contact.position, 'title_en')

  // Organization display name (use org_code as fallback since organizations table has no 'name')
  const orgDisplayName = contact.organization?.org_code || ''

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate text-start">{fullName}</h3>
            {positionTitle && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate text-start">{positionTitle}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {contact.organization && orgDisplayName && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1 text-xs whitespace-nowrap"
              >
                <Building2 className="h-3 w-3" />
                <span className="truncate max-w-[120px] sm:max-w-none">{orgDisplayName}</span>
              </Badge>
            )}
            {relationshipStats && relationshipStats.total > 0 && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-xs">
                <Network className="h-3 w-3" />
                <span>{relationshipStats.total}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Information */}
        <div className="space-y-2">
          {primaryEmail && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-start">{primaryEmail}</span>
            </div>
          )}

          {primaryPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className={`${isRTL ? 'text-end' : 'text-start'}`} dir="ltr">
                {primaryPhone}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {matchedTags.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t">
            <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5 flex-1">
              {matchedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                  style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Additional email/phone count indicators */}
        {(emailAddresses.length > 1 || phoneNumbers.length > 1) && (
          <div className="flex gap-3 text-xs text-muted-foreground pt-2">
            {emailAddresses.length > 1 && (
              <span>
                +{emailAddresses.length - 1} email{emailAddresses.length - 1 > 1 ? 's' : ''}
              </span>
            )}
            {phoneNumbers.length > 1 && (
              <span>
                +{phoneNumbers.length - 1} phone{phoneNumbers.length - 1 > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
