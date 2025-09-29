/**
 * Cross-tab preference synchronization using BroadcastChannel API
 * Fallback to localStorage events for browsers without BroadcastChannel
 */

import type { StoredPreferences } from '../storage/preference-storage';

type PreferenceMessage = {
  type: 'preference-update';
  data: StoredPreferences;
  timestamp: number;
  tabId: string;
};

class PreferenceBroadcaster {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(preferences: StoredPreferences) => void> = new Set();
  private tabId: string;
  private fallbackKey = 'preference-broadcast';
  
  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.initChannel();
  }
  
  private initChannel() {
    if (typeof window === 'undefined') return;
    
    // Try to use BroadcastChannel if available
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('user-preferences');
        
        this.channel.addEventListener('message', (event: MessageEvent<PreferenceMessage>) => {
          // Ignore messages from the same tab
          if (event.data.tabId === this.tabId) return;
          
          if (event.data.type === 'preference-update') {
            this.notifyListeners(event.data.data);
          }
        });
      } catch (error) {
        console.warn('BroadcastChannel not available, falling back to localStorage:', error);
        this.setupFallback();
      }
    } else {
      this.setupFallback();
    }
  }
  
  private setupFallback() {
    // Use localStorage as fallback for cross-tab communication
    window.addEventListener('storage', (event) => {
      if (event.key === this.fallbackKey && event.newValue) {
        try {
          const message: PreferenceMessage = JSON.parse(event.newValue);
          
          // Ignore messages from the same tab or old messages
          if (message.tabId === this.tabId) return;
          if (Date.now() - message.timestamp > 5000) return; // Ignore messages older than 5 seconds
          
          if (message.type === 'preference-update') {
            this.notifyListeners(message.data);
          }
        } catch (error) {
          console.error('Failed to parse broadcast message:', error);
        }
      }
    });
  }
  
  private notifyListeners(preferences: StoredPreferences) {
    this.listeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.error('Error in preference broadcast listener:', error);
      }
    });
  }
  
  /**
   * Broadcast preference changes to other tabs
   */
  broadcast(preferences: StoredPreferences) {
    const message: PreferenceMessage = {
      type: 'preference-update',
      data: preferences,
      timestamp: Date.now(),
      tabId: this.tabId,
    };
    
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        console.error('Failed to broadcast via BroadcastChannel:', error);
        this.broadcastFallback(message);
      }
    } else {
      this.broadcastFallback(message);
    }
  }
  
  private broadcastFallback(message: PreferenceMessage) {
    try {
      // Use localStorage for fallback
      localStorage.setItem(this.fallbackKey, JSON.stringify(message));
      
      // Clean up after a short delay to avoid localStorage pollution
      setTimeout(() => {
        localStorage.removeItem(this.fallbackKey);
      }, 100);
    } catch (error) {
      console.error('Failed to broadcast via localStorage:', error);
    }
  }
  
  /**
   * Subscribe to preference changes from other tabs
   */
  subscribe(listener: (preferences: StoredPreferences) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const preferenceBroadcaster = new PreferenceBroadcaster();

/**
 * React hook for preference broadcasting
 */
export function usePreferenceBroadcast() {
  const broadcast = (preferences: StoredPreferences) => {
    preferenceBroadcaster.broadcast(preferences);
  };
  
  const subscribe = (listener: (preferences: StoredPreferences) => void) => {
    return preferenceBroadcaster.subscribe(listener);
  };
  
  return {
    broadcast,
    subscribe,
  };
}