/**
 * UserPicker Component
 *
 * Searchable user selector built on top of SearchableSelect.
 * Queries the users table with debounced search by full_name.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { SearchableSelect, type SelectOption } from './SearchableSelect'

export interface UserPickerProps {
  value?: string
  onChange?: (userId: string | null) => void
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function UserPicker({
  value,
  onChange,
  label,
  placeholder,
  error,
  required,
  disabled,
  className,
}: UserPickerProps) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Load initial options (or selected user)
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true)
      try {
        const query = supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .eq('is_active', true)
          .order('full_name', { ascending: true })
          .limit(20)

        const { data, error: err } = await query
        if (err) {
          console.warn('Failed to load users:', err)
          return
        }

        const mapped = (data || []).map((u) => ({
          value: u.id,
          label: u.full_name || u.email || u.id,
          description: u.email || undefined,
          icon: u.avatar_url ? (
            <img src={u.avatar_url} alt="" className="size-5 rounded-full object-cover" />
          ) : undefined,
        }))

        setOptions(mapped)
      } finally {
        setLoading(false)
      }
    }

    loadInitial()
  }, [])

  const handleSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      if (!query || query.length < 2) return
      setLoading(true)
      try {
        const { data, error: err } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .eq('is_active', true)
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .order('full_name', { ascending: true })
          .limit(20)

        if (err) {
          console.warn('User search failed:', err)
          return
        }

        setOptions(
          (data || []).map((u) => ({
            value: u.id,
            label: u.full_name || u.email || u.id,
            description: u.email || undefined,
            icon: u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="size-5 rounded-full object-cover" />
            ) : undefined,
          })),
        )
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  return (
    <SearchableSelect
      options={options}
      value={value || undefined}
      onChange={(val) => {
        const selected = typeof val === 'string' ? val : null
        onChange?.(selected)
      }}
      onSearchChange={handleSearch}
      label={label}
      placeholder={placeholder || t('form.selectUser', 'Select user...')}
      searchPlaceholder={t('form.searchUsers', 'Search users...')}
      error={error}
      required={required}
      disabled={disabled}
      loading={loading}
      className={className}
    />
  )
}
