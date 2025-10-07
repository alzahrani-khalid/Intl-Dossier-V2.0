import { useState, useEffect, useCallback, useRef } from 'react'
import {
  User, FileText, Calendar, Users, MessageSquare,
  Edit3, Trash2, Plus, Check,
  GitBranch, Link, Upload, Download, Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { realtimeManager } from '../../lib/realtime'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'
import { useInView } from '../../hooks/useInView'

export interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'comment' | 'status_change' | 'upload' | 'download' | 'view' | 'share'
  entityType: 'mou' | 'document' | 'event' | 'contact' | 'task' | 'brief' | 'forum'
  entityId: string
  entityName: string
  actorId: string
  actorName: string
  actorAvatar?: string
  description: string
  metadata?: Record<string, any>
  timestamp: Date
  isNew?: boolean
}

interface ActivityFeedProps {
  channel?: string
  entityType?: Activity['entityType']
  entityId?: string
  maxActivities?: number
  showFilters?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

export function RealtimeActivityFeed({
  channel = 'global-activity',
  entityType,
  entityId,
  maxActivities = 100,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = '',
}: ActivityFeedProps) {
  const { user: _user } = useAuthStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<Set<Activity['type']>>(new Set())
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<Activity['entityType']>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef as React.RefObject<HTMLElement>)

  // Activity type configuration
  const activityConfig = {
    create: { icon: Plus, color: 'text-green-600', bgColor: 'bg-green-100' },
    update: { icon: Edit3, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    delete: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-100' },
    comment: { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    status_change: { icon: GitBranch, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    upload: { icon: Upload, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    download: { icon: Download, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    view: { icon: Eye, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    share: { icon: Link, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  }

  // Entity type icons
  const entityIcons = {
    mou: FileText,
    document: FileText,
    event: Calendar,
    contact: User,
    task: Check,
    brief: FileText,
    forum: Users,
  }

  // Load initial activities (mock data for demo)
  useEffect(() => {
    // In production, this would fetch from API
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'create',
        entityType: 'mou',
        entityId: 'mou-1',
        entityName: 'Saudi-Japan Technology Partnership',
        actorId: 'user-1',
        actorName: 'Ahmed Al-Rashid',
        description: 'created a new MoU',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      },
      {
        id: '2',
        type: 'comment',
        entityType: 'document',
        entityId: 'doc-1',
        entityName: 'Annual Report 2024',
        actorId: 'user-2',
        actorName: 'Sarah Johnson',
        description: 'commented on document',
        metadata: { comment: 'Great progress on the initiatives!' },
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      },
      {
        id: '3',
        type: 'status_change',
        entityType: 'task',
        entityId: 'task-1',
        entityName: 'Prepare G20 Summit Brief',
        actorId: 'user-3',
        actorName: 'Mohammed Al-Zahrani',
        description: 'marked task as completed',
        metadata: { from: 'in_progress', to: 'completed' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
    ]

    setActivities(mockActivities)
    setFilteredActivities(mockActivities)
    setIsLoading(false)
  }, [])

  // Subscribe to real-time activity updates
  useEffect(() => {
    const activityChannel = entityId ? `${channel}:${entityType}:${entityId}` : channel

    // Store subscription for cleanup
    realtimeManager.subscribe({
      channel: activityChannel,
      onBroadcast: (event: string, payload: any) => {
        if (event === 'new_activity') {
          handleNewActivity(payload)
        }
      },
      onDatabaseChange: (payload: any) => {
        if (payload.table === 'activities') {
          const activity: Activity = {
            id: payload.new.id,
            type: payload.new.type,
            entityType: payload.new.entity_type,
            entityId: payload.new.entity_id,
            entityName: payload.new.entity_name,
            actorId: payload.new.actor_id,
            actorName: payload.new.actor_name,
            actorAvatar: payload.new.actor_avatar,
            description: payload.new.description,
            metadata: payload.new.metadata,
            timestamp: new Date(payload.new.created_at),
            isNew: true,
          }
          handleNewActivity(activity)
        }
      },
    })

    setIsConnected(realtimeManager.isChannelSubscribed(activityChannel))

    return () => {
      realtimeManager.unsubscribe(activityChannel)
    }
  }, [channel, entityType, entityId])

  const handleNewActivity = useCallback((activity: Activity) => {
    setActivities((prev) => {
      // Check for duplicates
      if (prev.some(a => a.id === activity.id)) {
        return prev
      }

      // Add new activity with animation flag
      const newActivity = { ...activity, isNew: true }
      const updated = [newActivity, ...prev].slice(0, maxActivities)

      // Remove animation flag after delay
      setTimeout(() => {
        setActivities(current =>
          current.map(a => a.id === activity.id ? { ...a, isNew: false } : a)
        )
      }, 3000)

      return updated
    })
  }, [maxActivities])

  // Apply filters
  useEffect(() => {
    let filtered = [...activities]

    if (selectedTypes.size > 0) {
      filtered = filtered.filter(a => selectedTypes.has(a.type))
    }

    if (selectedEntityTypes.size > 0) {
      filtered = filtered.filter(a => selectedEntityTypes.has(a.entityType))
    }

    if (entityType) {
      filtered = filtered.filter(a => a.entityType === entityType)
    }

    if (entityId) {
      filtered = filtered.filter(a => a.entityId === entityId)
    }

    setFilteredActivities(filtered)
  }, [activities, selectedTypes, selectedEntityTypes, entityType, entityId])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Force re-render to update relative timestamps
      setActivities(current => [...current])
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Load more when scrolling to bottom
  useEffect(() => {
    if (isInView && hasMore && !isLoading) {
      loadMore()
    }
  }, [isInView, hasMore, isLoading])

  const loadMore = async () => {
    // In production, this would fetch more from API
    setPage(prev => prev + 1)
    // Simulate no more data after page 3
    if (page >= 3) {
      setHasMore(false)
    }
  }

  const toggleTypeFilter = (type: Activity['type']) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  // TODO: Implement filter toggle functionality in UI
  // const toggleEntityTypeFilter = (entityType: Activity['entityType']) => {
  //   setSelectedEntityTypes(prev => {
  //     const newSet = new Set(prev)
  //     if (newSet.has(entityType)) {
  //       newSet.delete(entityType)
  //     } else {
  //       newSet.add(entityType)
  //     }
  //     return newSet
  //   })
  // }

  const clearFilters = () => {
    setSelectedTypes(new Set())
    setSelectedEntityTypes(new Set())
  }

  const renderActivityIcon = (activity: Activity) => {
    const config = activityConfig[activity.type]
    const Icon = config.icon
    return (
      <div className={cn('p-2 rounded-full', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
    )
  }

  const renderActivityContent = (activity: Activity) => {
    const EntityIcon = entityIcons[activity.entityType]

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {activity.actorAvatar ? (
            <img
              src={activity.actorAvatar}
              alt={activity.actorName}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
              {activity.actorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-sm text-gray-900">
            {activity.actorName}
          </span>
          <span className="text-sm text-gray-600">
            {activity.description}
          </span>
        </div>
        <div className="mt-1 flex items-center space-x-2">
          <EntityIcon className="h-3 w-3 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            {activity.entityName}
          </span>
        </div>
        {activity.metadata?.comment && (
          <div className="mt-2 text-sm text-gray-600 italic">
            "{activity.metadata.comment}"
          </div>
        )}
        {activity.metadata?.from && activity.metadata?.to && (
          <div className="mt-2 text-sm">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {activity.metadata.from}
            </span>
            <span className="mx-1 text-gray-500">→</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              {activity.metadata.to}
            </span>
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-lg shadow', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
          <div className="flex items-center space-x-2">
            {isConnected && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Live</span>
              </div>
            )}
            {(selectedTypes.size > 0 || selectedEntityTypes.size > 0) && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {Object.entries(activityConfig).map(([type, config]) => {
              const Icon = config.icon
              const isSelected = selectedTypes.has(type as Activity['type'])
              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type as Activity['type'])}
                  className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3 w-3 me-1" />
                  {type.replace('_', ' ')}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity List */}
      <div
        ref={scrollContainerRef}
        className="max-h-96 overflow-y-auto"
      >
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              <span>Loading activities...</span>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No activities to show
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'px-4 py-3 hover:bg-gray-50 transition-all duration-300',
                  activity.isNew && 'bg-yellow-50 animate-highlight'
                )}
              >
                <div className="flex space-x-3">
                  {renderActivityIcon(activity)}
                  {renderActivityContent(activity)}
                </div>
              </div>
            ))}
            {hasMore && (
              <div ref={loadMoreRef} className="px-4 py-3 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900" />
                  <span>Loading more...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for tracking activities
export function useActivityTracking(entityType: Activity['entityType'], entityId: string) {
  const { user } = useAuthStore()

  const trackActivity = useCallback((
    type: Activity['type'],
    entityName: string,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return

    const activity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entityType,
      entityId,
      entityName,
      actorId: user.id,
      actorName: user.name || user.email,
      actorAvatar: user.avatar,
      description: description || `${type} ${entityType}`,
      metadata,
      timestamp: new Date(),
    }

    // Broadcast to global channel
    realtimeManager.broadcast('global-activity', 'new_activity', activity)

    // Broadcast to entity-specific channel
    realtimeManager.broadcast(
      `activity:${entityType}:${entityId}`,
      'new_activity',
      activity
    )
  }, [user, entityType, entityId])

  return { trackActivity }
}