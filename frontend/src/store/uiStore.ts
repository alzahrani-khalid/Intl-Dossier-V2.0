import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage } from '../i18n'

interface UIState {
  // Sidebar
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean

  // Theme
  theme: 'light' | 'dark' | 'system'

  // Language
  language: SupportedLanguage

  // Notifications
  notifications: Notification[]
  unreadCount: number

  // Modals
  modals: Record<string, boolean>

  // Loading states
  globalLoading: boolean
  loadingMessage: string | null

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (lang: SupportedLanguage) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  markNotificationAsRead: (id: string) => void
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: Date
  read: boolean
}

export type ModalState = Record<string, boolean>

export type { SupportedLanguage } from '../i18n'

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      theme: 'system',
      language: 'en',
      notifications: [],
      unreadCount: 0,
      modals: {},
      globalLoading: false,
      loadingMessage: null,

      // Actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        if (
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      setLanguage: (language) => set({ language }),

      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            read: false,
          }
          return {
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }
        }),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          const wasUnread = notification && !notification.read
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          }
        }),

      markNotificationAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          )
          const notification = state.notifications.find((n) => n.id === id)
          const wasUnread = notification && !notification.read
          return {
            notifications,
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          }
        }),

      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),

      closeModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        })),

      setGlobalLoading: (loading, message) =>
        set({
          globalLoading: loading,
          loadingMessage: message || null,
        }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    },
  ),
)
