export interface SyncMessage {
  type: 'preference-update';
  data: {
    theme?: 'gastat' | 'blueSky';
    colorMode?: 'light' | 'dark' | 'system';
    language?: 'en' | 'ar';
    timestamp: number;
  };
}

export class CrossTabSyncService {
  private channel: BroadcastChannel | null = null;
  private storageKey = 'theme-preference';
  private listeners: Set<(message: SyncMessage) => void> = new Set();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.initBroadcastChannel();
    } else {
      this.initStorageListener();
    }
  }

  private initBroadcastChannel(): void {
    try {
      this.channel = new BroadcastChannel('preferences-sync');
      
      this.channel.addEventListener('message', (event: MessageEvent) => {
        if (event.data && event.data.type === 'preference-update') {
          this.notifyListeners(event.data);
        }
      });
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
      this.initStorageListener();
    }
  }

  private initStorageListener(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== this.storageKey || !event.newValue) return;
      
      try {
        const parsed = JSON.parse(event.newValue);
        const message: SyncMessage = {
          type: 'preference-update',
          data: {
            theme: parsed.theme,
            colorMode: parsed.colorMode,
            language: parsed.language,
            timestamp: parsed.timestamp || Date.now(),
          },
        };
        this.notifyListeners(message);
      } catch (error) {
        console.error('Failed to parse storage event:', error);
      }
    });
  }

  broadcast(data: Partial<SyncMessage['data']>): void {
    const message: SyncMessage = {
      type: 'preference-update',
      data: {
        ...data,
        timestamp: Date.now(),
      },
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        console.error('Failed to broadcast message:', error);
      }
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      const current = stored ? JSON.parse(stored) : {};
      
      localStorage.setItem(this.storageKey, JSON.stringify({
        ...current,
        ...data,
        timestamp: message.data.timestamp,
      }));
    } catch (error) {
      console.error('Failed to update localStorage:', error);
    }
  }

  subscribe(callback: (message: SyncMessage) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(message: SyncMessage): void {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}