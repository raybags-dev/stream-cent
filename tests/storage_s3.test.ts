import { describe, expect, it } from 'vitest';
import {
  buildObjectKey,
  sanitizeFileName,
  sanitizeKeySegment,
  validateUpload,
} from '../sf_backend/storage/s3.storage';

describe('S3 storage helpers', () => {
  it('sanitizes key segments and prevents path traversal', () => {
    expect(sanitizeKeySegment('../user/../name', 'fallback')).toBe('user-..-name');
    expect(sanitizeKeySegment('***', 'fallback')).toBe('fallback');
    expect(sanitizeKeySegment('', 'fallback')).toBe('fallback');
  });

  it('sanitizes uploaded file names', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('My Movie (2026).mp4')).toBe('My-Movie-2026-.mp4');
    expect(sanitizeFileName('')).toBe('upload');
  });

  it('builds namespaced object keys', () => {
    expect(
      buildObjectKey('usr_123', 'video', 'asset_456', 'Trailer Final.mp4'),
    ).toBe('media/usr_123/video/asset_456/Trailer-Final.mp4');
  });

  it('accepts valid media uploads', () => {
    expect(
      validateUpload({
        fileName: 'trailer.mp4',
        contentType: 'video/mp4',
        size: 100 * 1024 * 1024,
        kind: 'video',
      }).valid,
    ).toBe(true);

    expect(
      validateUpload({
        fileName: 'poster.png',
        contentType: 'image/png',
        size: 2 * 1024 * 1024,
        kind: 'image',
      }).valid,
    ).toBe(true);

    expect(
      validateUpload({
        fileName: 'episode.mp3',
        contentType: 'audio/mpeg',
        size: 30 * 1024 * 1024,
        kind: 'audio',
      }).valid,
    ).toBe(true);
  });

  it('rejects unsupported extensions and content types', () => {
    expect(
      validateUpload({
        fileName: 'malware.exe',
        contentType: 'video/mp4',
        size: 1024,
        kind: 'video',
      }),
    ).toEqual({
      valid: false,
      error: 'Unsupported file extension ".exe" for video.',
    });

    expect(
      validateUpload({
        fileName: 'trailer.mp4',
        contentType: 'text/html',
        size: 1024,
        kind: 'video',
      }),
    ).toEqual({
      valid: false,
      error: 'Unsupported content type "text/html" for video.',
    });
  });

  it('rejects oversized and zero-byte uploads', () => {
    expect(
      validateUpload({
        fileName: 'poster.png',
        contentType: 'image/png',
        size: 25 * 1024 * 1024,
        kind: 'image',
      }).valid,
    ).toBe(false);

    expect(
      validateUpload({
        fileName: 'trailer.mp4',
        contentType: 'video/mp4',
        size: 0,
        kind: 'video',
      }).valid,
    ).toBe(false);
  });
});
