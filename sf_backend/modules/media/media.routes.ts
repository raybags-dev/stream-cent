import { randomUUID } from 'node:crypto';
import { Request, Response, Router } from 'express';
import { getCurrentUser, isAdminRequest } from '../../middleware/auth';
import {
  createMediaAsset,
  deleteMediaAsset,
  findMediaAsset,
  listMediaAssets,
  updateMediaAsset,
} from '../../db/media.repository';
import {
  buildObjectKey,
  s3Storage,
  validateUpload,
  type MediaKind,
} from '../../storage/s3.storage';
import { MediaAsset } from '../../types';

const router = Router();

const PRESIGN_EXPIRES_SECONDS = 900;
const VALID_KINDS: MediaKind[] = ['video', 'audio', 'image', 'hls'];

function isMediaKind(value: unknown): value is MediaKind {
  return typeof value === 'string' && VALID_KINDS.includes(value as MediaKind);
}

async function canAccessAsset(req: Request, ownerId: string): Promise<boolean> {
  if (isAdminRequest(req)) return true;
  const user = await getCurrentUser(req);
  return user !== null && user.id === ownerId;
}

router.post('/media/presign-upload', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    if (!s3Storage.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: { message: 'Object storage is not configured for this environment.' },
      });
    }

    const { fileName, contentType, size, kind } = req.body ?? {};

    if (typeof fileName !== 'string' || typeof contentType !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'fileName and contentType are required strings.' },
      });
    }

    if (typeof size !== 'number' || !Number.isFinite(size)) {
      return res.status(400).json({
        success: false,
        error: { message: 'size must be a positive number of bytes.' },
      });
    }

    if (!isMediaKind(kind)) {
      return res.status(400).json({
        success: false,
        error: { message: `kind must be one of: ${VALID_KINDS.join(', ')}.` },
      });
    }

    const validation = validateUpload({ fileName, contentType, size, kind });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error ?? 'Invalid upload request.' },
      });
    }

    const assetId = `asset_${randomUUID()}`;
    const key = buildObjectKey(user.id, kind, assetId, fileName);
    const now = new Date().toISOString();

    const asset: MediaAsset = {
      assetId,
      ownerId: user.id,
      key,
      fileName,
      contentType: contentType.toLowerCase(),
      size,
      kind,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const stored = await createMediaAsset(asset);
    if (!stored) {
      return res.status(503).json({
        success: false,
        error: { message: 'Media metadata store is unavailable.' },
      });
    }

    const uploadUrl = await s3Storage.presignUpload(
      key,
      contentType.toLowerCase(),
      PRESIGN_EXPIRES_SECONDS,
    );

    return res.status(201).json({
      success: true,
      data: {
        asset,
        uploadUrl,
        expiresIn: PRESIGN_EXPIRES_SECONDS,
        headers: { 'Content-Type': contentType.toLowerCase() },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unable to prepare upload.' },
    });
  }
});

router.post('/media/complete-upload', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.body ?? {};
    if (typeof assetId !== 'string' || assetId.trim() === '') {
      return res.status(400).json({ success: false, error: { message: 'assetId is required.' } });
    }

    const asset = await findMediaAsset(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, error: { message: 'Media asset not found.' } });
    }
    if (!(await canAccessAsset(req, asset.ownerId))) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden.' } });
    }

    const object = await s3Storage.headObject(asset.key);
    if (!object.exists) {
      return res.status(409).json({
        success: false,
        error: { message: 'Uploaded object was not found in object storage.' },
      });
    }

    const updated = await updateMediaAsset(assetId, {
      status: 'uploaded',
      uploadedAt: new Date().toISOString(),
      size: object.contentLength ?? asset.size,
      contentType: object.contentType ?? asset.contentType,
    });

    return res.json({ success: true, data: updated ?? asset });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unable to complete upload.' },
    });
  }
});

router.get('/media', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    const ownerId = isAdminRequest(req) && typeof req.query.ownerId === 'string'
      ? req.query.ownerId
      : user.id;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
    const assets = await listMediaAssets(ownerId, Number.isNaN(limit) ? 100 : limit);

    return res.json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unable to list media assets.' },
    });
  }
});

router.get('/media/:assetId/url', async (req: Request, res: Response) => {
  try {
    const asset = await findMediaAsset(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ success: false, error: { message: 'Media asset not found.' } });
    }
    if (!(await canAccessAsset(req, asset.ownerId))) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden.' } });
    }
    if (asset.status !== 'uploaded') {
      return res.status(409).json({
        success: false,
        error: { message: 'Media asset has not completed uploading.' },
      });
    }

    const url = await s3Storage.presignDownload(asset.key, {
      fileName: asset.fileName,
      expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
    });

    return res.json({
      success: true,
      data: { url, expiresIn: PRESIGN_EXPIRES_SECONDS, asset },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unable to sign media URL.' },
    });
  }
});

router.delete('/media/:assetId', async (req: Request, res: Response) => {
  try {
    const asset = await findMediaAsset(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ success: false, error: { message: 'Media asset not found.' } });
    }
    if (!(await canAccessAsset(req, asset.ownerId))) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden.' } });
    }

    await s3Storage.deleteObject(asset.key);
    const deleted = await deleteMediaAsset(asset.assetId);
    if (!deleted) {
      return res.status(503).json({
        success: false,
        error: { message: 'Object removed but media metadata could not be deleted.' },
      });
    }

    return res.json({ success: true, message: 'Media asset deleted.' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unable to delete media asset.' },
    });
  }
});

export default router;
