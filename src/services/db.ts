import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DownloadItem, WatchProgress, UserSettings } from '../types';

interface NetflixOfflineDBSchema extends DBSchema {
  downloads: {
    key: string;
    value: DownloadItem;
    indexes: { 'by-contentId': string; 'by-status': string };
  };
  watchProgress: {
    key: string;
    value: WatchProgress;
    indexes: { 'by-updatedAt': number };
  };
  myList: {
    key: string;
    value: { id: string; addedAt: number };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

const DB_NAME = 'netflix_offline_vault_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NetflixOfflineDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<NetflixOfflineDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<NetflixOfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Downloads store
        if (!db.objectStoreNames.contains('downloads')) {
          const downloadStore = db.createObjectStore('downloads', { keyPath: 'id' });
          downloadStore.createIndex('by-contentId', 'contentId');
          downloadStore.createIndex('by-status', 'status');
        }

        // Watch progress store
        if (!db.objectStoreNames.contains('watchProgress')) {
          const progressStore = db.createObjectStore('watchProgress', { keyPath: 'id' });
          progressStore.createIndex('by-updatedAt', 'updatedAt');
        }

        // My List store
        if (!db.objectStoreNames.contains('myList')) {
          db.createObjectStore('myList', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Downloads operations
export async function saveDownload(item: DownloadItem): Promise<void> {
  const db = await getDB();
  // Strip temporary blobUrl if saving to db to avoid stale object URLs
  const toSave = { ...item };
  delete toSave.videoBlobUrl;
  await db.put('downloads', toSave);
}

export async function getDownload(id: string): Promise<DownloadItem | undefined> {
  const db = await getDB();
  const item = await db.get('downloads', id);
  if (item && item.videoBlob) {
    item.videoBlobUrl = URL.createObjectURL(item.videoBlob);
  }
  return item;
}

export async function getAllDownloads(): Promise<DownloadItem[]> {
  const db = await getDB();
  const items = await db.getAll('downloads');
  // Create object URLs for completed blobs
  return items.map((item) => {
    if (item.videoBlob) {
      item.videoBlobUrl = URL.createObjectURL(item.videoBlob);
    }
    return item;
  });
}

export async function deleteDownload(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('downloads', id);
}

export async function clearAllDownloads(): Promise<void> {
  const db = await getDB();
  await db.clear('downloads');
}

export async function getStorageUsage(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  downloadsCount: number;
}> {
  let usedBytes = 0;
  let quotaBytes = 10 * 1024 * 1024 * 1024; // default 10GB fallback

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || quotaBytes;
    } catch {
      // fallback
    }
  }

  const downloads = await getAllDownloads();
  const completedDownloads = downloads.filter((d) => d.status === 'completed');
  const calculatedDownloadBytes = completedDownloads.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);

  return {
    usedBytes: Math.max(usedBytes, calculatedDownloadBytes),
    quotaBytes,
    downloadsCount: completedDownloads.length,
  };
}

// Watch Progress operations
export async function saveWatchProgress(progress: WatchProgress): Promise<void> {
  const db = await getDB();
  await db.put('watchProgress', progress);
}

export async function getWatchProgress(id: string): Promise<WatchProgress | undefined> {
  const db = await getDB();
  return db.get('watchProgress', id);
}

export async function getAllWatchProgress(): Promise<WatchProgress[]> {
  const db = await getDB();
  return db.getAllFromIndex('watchProgress', 'by-updatedAt');
}

export async function deleteWatchProgress(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('watchProgress', id);
}

// My List operations
export async function getMyList(): Promise<string[]> {
  const db = await getDB();
  const list = await db.getAll('myList');
  return list.map((item) => item.id);
}

export async function toggleMyList(id: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('myList', id);
  if (existing) {
    await db.delete('myList', id);
    return false;
  } else {
    await db.put('myList', { id, addedAt: Date.now() });
    return true;
  }
}

// Settings operations
const DEFAULT_SETTINGS: UserSettings = {
  downloadQuality: 'standard',
  smartDownloads: true,
  wifiOnly: false,
  autoPlayNext: true,
  storageLimitMB: 5000,
};

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'user_settings');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'user_settings');
}
