/**
 * useThemes Hooks
 *
 * TanStack Query hooks for theme entity CRUD operations with taxonomy support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  Theme,
  ThemeListResponse,
  ThemeFilters,
  ThemeCreateRequest,
  ThemeUpdateRequest,
  ThemeExtension,
  ThemeNode,
  ThemeTreeResponse,
  ThemeWithContext,
  ThemeAncestor,
  ThemeDescendant,
  themeKeys,
} from '@/types/theme.types'

const THEMES_QUERY_KEY = 'themes'
const THEME_QUERY_KEY = 'theme'
const THEME_TREE_QUERY_KEY = 'theme-tree'

/**
 * Build a tree structure from flat theme data
 */
function buildThemeTree(
  themes: Array<{
    id: string
    name_en: string
    name_ar: string
    category_code: string
    hierarchy_level: number
    parent_theme_id: string | null
    icon?: string | null
    color?: string | null
    is_standard?: boolean
    sort_order?: number
  }>,
): ThemeNode[] {
  const nodeMap = new Map<string, ThemeNode>()
  const roots: ThemeNode[] = []

  // First pass: create all nodes
  themes.forEach((theme) => {
    nodeMap.set(theme.id, {
      ...theme,
      children: [],
    })
  })

  // Second pass: build tree structure
  themes.forEach((theme) => {
    const node = nodeMap.get(theme.id)!
    if (theme.parent_theme_id && nodeMap.has(theme.parent_theme_id)) {
      const parent = nodeMap.get(theme.parent_theme_id)!
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Sort children by sort_order, then name_en
  const sortChildren = (nodes: ThemeNode[]) => {
    nodes.sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return a.name_en.localeCompare(b.name_en)
    })
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children)
      }
    })
  }

  sortChildren(roots)
  return roots
}

/**
 * Fetch paginated list of themes
 */
export function useThemes(filters: ThemeFilters = {}) {
  return useQuery<ThemeListResponse, Error>({
    queryKey: [THEMES_QUERY_KEY, filters],
    queryFn: async () => {
      const { search, status, parent_theme_id, is_standard, page = 1, limit = 20 } = filters
      const offset = (page - 1) * limit

      // Query base dossier table with theme type
      let query = supabase
        .from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'theme')
        .neq('status', 'archived')

      // Apply search filter
      if (search) {
        query = query.or(
          `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,description_en.ilike.%${search}%,description_ar.ilike.%${search}%`,
        )
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination and ordering
      query = query.order('name_en', { ascending: true }).range(offset, offset + limit - 1)

      const { data: dossiers, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get theme extension data for all dossiers
      const themeIds = (dossiers || []).map((d) => d.id)
      let extensions: Record<string, ThemeExtension> = {}

      if (themeIds.length > 0) {
        let extQuery = supabase.from('themes').select('*').in('id', themeIds)

        // Apply parent filter if specified
        if (parent_theme_id !== undefined) {
          if (parent_theme_id === null) {
            extQuery = extQuery.is('parent_theme_id', null)
          } else {
            extQuery = extQuery.eq('parent_theme_id', parent_theme_id)
          }
        }

        // Apply is_standard filter
        if (is_standard !== undefined) {
          extQuery = extQuery.eq('is_standard', is_standard)
        }

        const { data: themeExts } = await extQuery

        if (themeExts) {
          extensions = themeExts.reduce(
            (acc, ext) => {
              acc[ext.id] = ext
              return acc
            },
            {} as Record<string, ThemeExtension>,
          )
        }
      }

      // Combine dossier and extension data
      // Filter to only include themes that have extensions matching criteria
      const themes: Theme[] = (dossiers || [])
        .filter((d) => extensions[d.id])
        .map((d) => ({
          ...d,
          type: 'theme' as const,
          extension: extensions[d.id] || { category_code: 'UNKNOWN' },
        }))

      return {
        data: themes,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch single theme by ID
 */
export function useTheme(id: string | undefined) {
  return useQuery<ThemeWithContext | null, Error>({
    queryKey: [THEME_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null

      // Get base dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', id)
        .eq('type', 'theme')
        .single()

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      if (!dossier) return null

      // Get theme extension data from the view for context
      const { data: themeDetails } = await supabase
        .from('theme_details')
        .select('*')
        .eq('id', id)
        .single()

      if (!themeDetails) {
        // Fallback to just the extension table
        const { data: themeExt } = await supabase.from('themes').select('*').eq('id', id).single()

        return {
          ...dossier,
          type: 'theme' as const,
          extension: themeExt || { category_code: 'UNKNOWN' },
        }
      }

      return {
        ...dossier,
        type: 'theme' as const,
        extension: {
          id: themeDetails.id,
          parent_theme_id: themeDetails.parent_theme_id,
          category_code: themeDetails.category_code,
          hierarchy_level: themeDetails.hierarchy_level,
          icon: themeDetails.icon,
          color: themeDetails.color,
          attributes: themeDetails.attributes,
          sort_order: themeDetails.sort_order,
          is_standard: themeDetails.is_standard,
          external_url: themeDetails.external_url,
        },
        parent_name_en: themeDetails.parent_name_en,
        parent_name_ar: themeDetails.parent_name_ar,
        parent_category_code: themeDetails.parent_category_code,
        children_count: themeDetails.children_count,
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch theme tree (hierarchical structure)
 */
export function useThemeTree() {
  return useQuery<ThemeTreeResponse, Error>({
    queryKey: [THEME_TREE_QUERY_KEY],
    queryFn: async () => {
      // Use the get_theme_tree RPC function
      const { data, error } = await supabase.rpc('get_theme_tree')

      if (error) {
        throw new Error(error.message)
      }

      const treeData = buildThemeTree(data || [])

      return {
        data: treeData,
        total: (data || []).length,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch root themes only (no parent)
 */
export function useRootThemes() {
  return useQuery<Theme[], Error>({
    queryKey: [THEMES_QUERY_KEY, 'roots'],
    queryFn: async () => {
      // Get themes with no parent
      const { data: themeExts, error: extError } = await supabase
        .from('themes')
        .select('*')
        .is('parent_theme_id', null)
        .order('sort_order')
        .order('category_code')

      if (extError) {
        throw new Error(extError.message)
      }

      if (!themeExts || themeExts.length === 0) {
        return []
      }

      // Get corresponding dossiers
      const themeIds = themeExts.map((t) => t.id)
      const { data: dossiers, error: dossierError } = await supabase
        .from('dossiers')
        .select('*')
        .in('id', themeIds)
        .eq('type', 'theme')
        .neq('status', 'archived')

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      // Create a map for quick lookup
      const extensionMap = themeExts.reduce(
        (acc, ext) => {
          acc[ext.id] = ext
          return acc
        },
        {} as Record<string, ThemeExtension>,
      )

      return (dossiers || []).map((d) => ({
        ...d,
        type: 'theme' as const,
        extension: extensionMap[d.id] || { category_code: 'UNKNOWN' },
      }))
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch child themes of a parent
 */
export function useChildThemes(parentId: string | null) {
  return useQuery<Theme[], Error>({
    queryKey: [THEMES_QUERY_KEY, 'children', parentId],
    queryFn: async () => {
      let extQuery = supabase.from('themes').select('*').order('sort_order').order('category_code')

      if (parentId === null) {
        extQuery = extQuery.is('parent_theme_id', null)
      } else {
        extQuery = extQuery.eq('parent_theme_id', parentId)
      }

      const { data: themeExts, error: extError } = await extQuery

      if (extError) {
        throw new Error(extError.message)
      }

      if (!themeExts || themeExts.length === 0) {
        return []
      }

      // Get corresponding dossiers
      const themeIds = themeExts.map((t) => t.id)
      const { data: dossiers, error: dossierError } = await supabase
        .from('dossiers')
        .select('*')
        .in('id', themeIds)
        .eq('type', 'theme')
        .neq('status', 'archived')

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      const extensionMap = themeExts.reduce(
        (acc, ext) => {
          acc[ext.id] = ext
          return acc
        },
        {} as Record<string, ThemeExtension>,
      )

      return (dossiers || []).map((d) => ({
        ...d,
        type: 'theme' as const,
        extension: extensionMap[d.id] || { category_code: 'UNKNOWN' },
      }))
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch theme ancestors
 */
export function useThemeAncestors(id: string | undefined) {
  return useQuery<ThemeAncestor[], Error>({
    queryKey: [THEMES_QUERY_KEY, 'ancestors', id],
    queryFn: async () => {
      if (!id) return []

      const { data, error } = await supabase.rpc('get_theme_ancestors', { theme_id: id })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch theme descendants
 */
export function useThemeDescendants(id: string | undefined) {
  return useQuery<ThemeDescendant[], Error>({
    queryKey: [THEMES_QUERY_KEY, 'descendants', id],
    queryFn: async () => {
      if (!id) return []

      const { data, error } = await supabase.rpc('get_theme_descendants', { theme_id: id })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create new theme
 */
export function useCreateTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ThemeCreateRequest) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Create base dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .insert({
          type: 'theme',
          name_en: data.name_en,
          name_ar: data.name_ar,
          description_en: data.description_en || null,
          description_ar: data.description_ar || null,
          status: data.status || 'active',
          sensitivity_level: data.sensitivity_level || 1,
          tags: data.tags || [],
        })
        .select()
        .single()

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      // Create theme extension
      if (data.extension) {
        const { error: extError } = await supabase.from('themes').insert({
          id: dossier.id,
          parent_theme_id: data.extension.parent_theme_id || null,
          category_code: data.extension.category_code,
          icon: data.extension.icon || null,
          color: data.extension.color || null,
          attributes: data.extension.attributes || {},
          sort_order: data.extension.sort_order || 0,
          is_standard: data.extension.is_standard || false,
          external_url: data.extension.external_url || null,
        })

        if (extError) {
          console.error('Error creating theme extension:', extError)
          // Rollback dossier creation
          await supabase.from('dossiers').delete().eq('id', dossier.id)
          throw new Error(extError.message)
        }
      } else {
        // Extension is required - category_code is mandatory
        throw new Error('Theme extension with category_code is required')
      }

      return {
        ...dossier,
        type: 'theme' as const,
        extension: data.extension || { category_code: 'UNKNOWN' },
      } as Theme
    },
    onSuccess: (newTheme) => {
      queryClient.invalidateQueries({ queryKey: [THEMES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [THEME_TREE_QUERY_KEY] })
      queryClient.setQueryData([THEME_QUERY_KEY, newTheme.id], newTheme)
      toast.success('Theme created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create theme')
    },
  })
}

/**
 * Update existing theme
 */
export function useUpdateTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ThemeUpdateRequest }) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Update base dossier fields
      const dossierUpdate: Record<string, unknown> = {}
      if (data.name_en !== undefined) dossierUpdate.name_en = data.name_en
      if (data.name_ar !== undefined) dossierUpdate.name_ar = data.name_ar
      if (data.description_en !== undefined) dossierUpdate.description_en = data.description_en
      if (data.description_ar !== undefined) dossierUpdate.description_ar = data.description_ar
      if (data.status !== undefined) dossierUpdate.status = data.status
      if (data.sensitivity_level !== undefined)
        dossierUpdate.sensitivity_level = data.sensitivity_level
      if (data.tags !== undefined) dossierUpdate.tags = data.tags

      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .update(dossierUpdate)
        .eq('id', id)
        .eq('type', 'theme')
        .select()
        .single()

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      // Update theme extension if provided
      let themeExt = null
      if (data.extension) {
        // Check if extension exists
        const { data: existingExt } = await supabase
          .from('themes')
          .select('id')
          .eq('id', id)
          .single()

        const extUpdate: Record<string, unknown> = {}
        if (data.extension.parent_theme_id !== undefined)
          extUpdate.parent_theme_id = data.extension.parent_theme_id
        if (data.extension.category_code !== undefined)
          extUpdate.category_code = data.extension.category_code
        if (data.extension.icon !== undefined) extUpdate.icon = data.extension.icon
        if (data.extension.color !== undefined) extUpdate.color = data.extension.color
        if (data.extension.attributes !== undefined)
          extUpdate.attributes = data.extension.attributes
        if (data.extension.sort_order !== undefined)
          extUpdate.sort_order = data.extension.sort_order
        if (data.extension.is_standard !== undefined)
          extUpdate.is_standard = data.extension.is_standard
        if (data.extension.external_url !== undefined)
          extUpdate.external_url = data.extension.external_url

        if (existingExt) {
          // Update existing
          const { data: updatedExt, error: extError } = await supabase
            .from('themes')
            .update(extUpdate)
            .eq('id', id)
            .select()
            .single()

          if (!extError) themeExt = updatedExt
        } else {
          // Create new (shouldn't happen normally, but handle it)
          const { data: newExt, error: extError } = await supabase
            .from('themes')
            .insert({
              id: id,
              ...extUpdate,
              category_code: data.extension.category_code || 'UNKNOWN',
            })
            .select()
            .single()

          if (!extError) themeExt = newExt
        }
      } else {
        // Fetch existing extension
        const { data: existingExt } = await supabase
          .from('themes')
          .select('*')
          .eq('id', id)
          .single()
        themeExt = existingExt
      }

      return {
        ...dossier,
        type: 'theme' as const,
        extension: themeExt || { category_code: 'UNKNOWN' },
      } as Theme
    },
    onSuccess: (updatedTheme) => {
      queryClient.invalidateQueries({ queryKey: [THEMES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [THEME_TREE_QUERY_KEY] })
      queryClient.setQueryData([THEME_QUERY_KEY, updatedTheme.id], updatedTheme)
      toast.success('Theme updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update theme')
    },
  })
}

/**
 * Delete theme (soft delete by changing status to archived)
 */
export function useDeleteTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Check for children - can't delete theme with children
      const { data: children } = await supabase
        .from('themes')
        .select('id')
        .eq('parent_theme_id', id)
        .limit(1)

      if (children && children.length > 0) {
        throw new Error('Cannot delete theme with child themes. Delete children first.')
      }

      // Soft delete by updating status
      const { error } = await supabase
        .from('dossiers')
        .update({ status: 'archived' })
        .eq('id', id)
        .eq('type', 'theme')

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: [THEMES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [THEME_TREE_QUERY_KEY] })
      queryClient.removeQueries({ queryKey: [THEME_QUERY_KEY, deletedId] })
      toast.success('Theme deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete theme')
    },
  })
}

/**
 * Move theme to a new parent (change hierarchy)
 */
export function useMoveTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const { data, error } = await supabase
        .from('themes')
        .update({ parent_theme_id: newParentId })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THEMES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [THEME_TREE_QUERY_KEY] })
      toast.success('Theme moved successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to move theme')
    },
  })
}
