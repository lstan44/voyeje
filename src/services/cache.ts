import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Incident } from '../types';

interface MapCacheDB extends DBSchema {
  incidents: {
    key: string;
    value: {
      data: Incident[];
      timestamp: number;
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
    };
  };
}

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

class MapCache {
  private db: IDBPDatabase<MapCacheDB> | null = null;

  async init() {
    this.db = await openDB<MapCacheDB>('map-cache', 1, {
      upgrade(db) {
        db.createObjectStore('incidents');
      },
    });
  }

  private getBoundsKey(bounds: MapBounds): string {
    return `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`;
  }

  async getCachedIncidents(bounds: MapBounds): Promise<Incident[] | null> {
    if (!this.db) await this.init();
    const key = this.getBoundsKey(bounds);
    const cached = await this.db!.get('incidents', key);

    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      await this.db!.delete('incidents', key);
      return null;
    }

    return cached.data;
  }

  async cacheIncidents(bounds: MapBounds, incidents: Incident[]) {
    if (!this.db) await this.init();
    const key = this.getBoundsKey(bounds);
    await this.db!.put('incidents', {
      data: incidents,
      timestamp: Date.now(),
      bounds,
    }, key);
  }
}

export const mapCache = new MapCache();
