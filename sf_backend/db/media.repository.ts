import { Collection, WithId } from 'mongodb';
import { MediaAsset } from '../types';
import { getMongoDb } from './mongo.client';

const MEDIA_COLLECTION = 'media_assets';

let cachedCollection: Collection<MediaAsset> | null = null;

async function getCollection(): Promise<Collection<MediaAsset> | null> {
  if (cachedCollection) return cachedCollection;
  const db = await getMongoDb();
  if (!db) return null;
  cachedCollection = db.collection<MediaAsset>(MEDIA_COLLECTION);
  return cachedCollection;
}

function toMediaAsset(document: WithId<MediaAsset> | null): MediaAsset | null {
  if (!document) return null;
  const { _id, ...asset } = document;
  void _id;
  return asset;
}

export async function createMediaAsset(asset: MediaAsset): Promise<boolean> {
  const collection = await getCollection();
  if (!collection) return false;

  try {
    await collection.updateOne(
      { assetId: asset.assetId },
      { $set: asset },
      { upsert: true },
    );
    return true;
  } catch (error) {
    console.warn(
      '[Media Store] Unable to persist media asset:',
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

export async function findMediaAsset(assetId: string): Promise<MediaAsset | null> {
  const collection = await getCollection();
  if (!collection) return null;

  try {
    const document = await collection.findOne({ assetId });
    return toMediaAsset(document);
  } catch (error) {
    console.warn(
      '[Media Store] Unable to read media asset:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export async function listMediaAssets(
  ownerId: string,
  limit = 100,
): Promise<MediaAsset[]> {
  const collection = await getCollection();
  if (!collection) return [];

  try {
    const documents = await collection
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .toArray();

    return documents
      .map((document) => toMediaAsset(document))
      .filter((asset): asset is MediaAsset => asset !== null);
  } catch (error) {
    console.warn(
      '[Media Store] Unable to list media assets:',
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

export async function updateMediaAsset(
  assetId: string,
  updates: Partial<Omit<MediaAsset, 'assetId' | 'ownerId' | 'createdAt'>>,
): Promise<MediaAsset | null> {
  const collection = await getCollection();
  if (!collection) return null;

  try {
    const document = await collection.findOneAndUpdate(
      { assetId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' },
    );
    return toMediaAsset(document);
  } catch (error) {
    console.warn(
      '[Media Store] Unable to update media asset:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export async function deleteMediaAsset(assetId: string): Promise<boolean> {
  const collection = await getCollection();
  if (!collection) return false;

  try {
    const result = await collection.deleteOne({ assetId });
    return result.deletedCount === 1;
  } catch (error) {
    console.warn(
      '[Media Store] Unable to delete media asset:',
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

export async function countMediaAssets(): Promise<number> {
  const collection = await getCollection();
  if (!collection) return 0;

  try {
    return await collection.countDocuments();
  } catch {
    return 0;
  }
}
