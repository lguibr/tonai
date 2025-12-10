import { openDB, DBSchema } from 'idb';

interface Track {
  id: string;
  name: string;
  code: string;
  collection: string;
  createdAt: number;
}

interface TonAIDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: { 'by-collection': string };
  };
}

const DB_NAME = 'tonai-db';
const STORE_NAME = 'tracks';

const dbPromise = openDB<TonAIDB>(DB_NAME, 1, {
  upgrade(db) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    store.createIndex('by-collection', 'collection');
  },
});

export const saveTrack = async (track: Omit<Track, 'id' | 'createdAt'>) => {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const newTrack: Track = {
    ...track,
    id,
    createdAt: Date.now(),
  };
  await db.put(STORE_NAME, newTrack);
  return newTrack;
};

export const getTracks = async () => {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
};

export const deleteTrack = async (id: string) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
};

export const getCollections = async () => {
  const tracks = await getTracks();
  const collections = new Set(tracks.map((t) => t.collection).filter(Boolean));
  return Array.from(collections).sort();
};

export const deleteCollection = async (collectionName: string) => {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const index = tx.store.index('by-collection');

  // Get all keys for tracks in this collection
  const keys = await index.getAllKeys(collectionName);

  // Delete each track
  await Promise.all(keys.map((key) => db.delete(STORE_NAME, key)));
  await tx.done;
};

export const renameCollection = async (oldName: string, newName: string) => {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const index = tx.store.index('by-collection');

  const tracks = await index.getAll(oldName);

  await Promise.all(
    tracks.map((track) => {
      track.collection = newName;
      return db.put(STORE_NAME, track);
    })
  );

  await tx.done;
};

export const updateTrackCollection = async (trackId: string, newCollection: string) => {
  const db = await dbPromise;
  const track = await db.get(STORE_NAME, trackId);
  if (track) {
    track.collection = newCollection;
    await db.put(STORE_NAME, track);
  }
};
