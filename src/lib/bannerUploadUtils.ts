/**
 * Utilities for resilient event banner upload handling:
 * 1. Client-side compression & resizing (max 1600px edge, JPEG quality ~80%)
 * 2. Upload retry loop with backoff for transient network-level failures (520, 522, timeouts, fetch failures)
 * 3. User-friendly error messaging for raw HTTP / network drops
 */

import { isHeicImage, prepareImageForUpload } from '@/lib/imageUtils';

export interface CompressedBannerResult {
  blob: Blob;
  contentType: string;
  ext: string;
}

/**
 * Checks whether an error is a transient network-level failure
 * (e.g. 520, 522, timeouts, fetch failures) vs a real Supabase error (RLS, validation, auth).
 */
export function isNetworkLevelError(err: any): boolean {
  if (!err) return false;

  const status = Number(err.status ?? err.statusCode ?? err.code ?? 0);
  if ([520, 522, 502, 503, 504].includes(status)) {
    return true;
  }

  // Non-retryable client, validation, permission or RLS errors
  if ([400, 401, 403, 404, 409, 413, 422].includes(status)) {
    return false;
  }

  const str = (
    (typeof err === 'string' ? err : '') + ' ' +
    (err.message || '') + ' ' +
    (err.error || '') + ' ' +
    (err.name || '') + ' ' +
    (err.statusText || '') + ' ' +
    (err.details || '')
  ).toLowerCase();

  // Explicit Supabase / DB / Auth errors that must fail immediately
  if (
    str.includes('row-level security') ||
    str.includes('violates row-level security') ||
    str.includes('policy') ||
    str.includes('unauthorized') ||
    str.includes('permission denied') ||
    str.includes('not permitted') ||
    str.includes('bucket not found') ||
    str.includes('duplicate') ||
    str.includes('payload too large') ||
    str.includes('file size exceeds')
  ) {
    return false;
  }

  // Transient network error keywords
  return (
    str.includes('520') ||
    str.includes('522') ||
    str.includes('timeout') ||
    str.includes('timed out') ||
    str.includes('fetch failure') ||
    str.includes('failed to fetch') ||
    str.includes('networkerror') ||
    str.includes('network error') ||
    str.includes('fetch failed') ||
    str.includes('connection error') ||
    str.includes('load failed') ||
    str.includes('connection timed out') ||
    str.includes('abort') ||
    str.includes('socket hang up') ||
    str.includes('econnreset') ||
    str.includes('etimedout')
  );
}

/**
 * Resizes and compresses an image client-side before upload.
 * Default constraint: max 1600px edge, JPEG quality 0.8 (80%).
 * Ensures large photos from smartphone cameras transfer swiftly without socket drops.
 */
export async function compressAndResizeBannerImage(
  input: File | Blob | string,
  maxEdge: number = 2048,
  quality: number = 0.9
): Promise<CompressedBannerResult> {
  // Convert iPhone HEIC/HEIF photos to JPEG first
  if (typeof window !== 'undefined') {
    if (input instanceof File && isHeicImage(input)) {
      input = await prepareImageForUpload(input);
    } else if (input instanceof Blob && isHeicImage(input)) {
      const file = new File([input], 'banner.heic', { type: input.type || 'image/heic' });
      input = await prepareImageForUpload(file);
    }
  }

  // If not running in browser environment, return fallback
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (typeof input === 'string') {
      const blob = new Blob([input], { type: 'image/jpeg' });
      return { blob, contentType: 'image/jpeg', ext: 'jpg' };
    }
    const contentType = input.type || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    return { blob: input, contentType, ext };
  }

  let objectUrlToRevoke: string | null = null;
  let sourceUrl = '';

  if (typeof input === 'string') {
    sourceUrl = input;
  } else {
    sourceUrl = URL.createObjectURL(input);
    objectUrlToRevoke = sourceUrl;
  }

  try {
    const img = new Image();
    // Allow cross-origin images if applicable
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = sourceUrl;
    });

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    // Resize proportionally so the longest edge is at most maxEdge
    if (width > maxEdge || height > maxEdge) {
      if (width > height) {
        height = Math.round((height * maxEdge) / width);
        width = maxEdge;
      } else {
        width = Math.round((width * maxEdge) / height);
        height = maxEdge;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // Fill white background in case source has alpha channel
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      } else {
        // Fallback for canvas without toBlob
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const parts = dataUrl.split(';base64,');
          const raw = window.atob(parts[1] || '');
          const uInt8Array = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          resolve(new Blob([uInt8Array], { type: 'image/jpeg' }));
        } catch {
          resolve(null);
        }
      }
    });

    if (blob) {
      return {
        blob,
        contentType: 'image/jpeg',
        ext: 'jpg'
      };
    }
  } catch (err) {
    console.warn('Banner compression warning, falling back to input:', err);
  } finally {
    if (objectUrlToRevoke) {
      URL.revokeObjectURL(objectUrlToRevoke);
    }
  }

  // Fallback if canvas compression encounters an issue
  if (typeof input === 'string') {
    const blob = new Blob([input], { type: 'image/jpeg' });
    return { blob, contentType: 'image/jpeg', ext: 'jpg' };
  }

  const contentType = input.type || 'image/jpeg';
  const ext = contentType.split('/')[1] || 'jpg';
  return { blob: input, contentType, ext };
}

/**
 * Uploads a banner to Supabase Storage with retry logic and backoff
 * specifically for network-level failures (520, 522, timeouts, fetch failures).
 * RLS and validation errors fail immediately with their real message.
 */
export async function uploadBannerWithRetry(
  supabaseClient: any,
  bucket: string,
  filePath: string,
  fileBlob: Blob,
  contentType: string,
  maxRetries: number = 2,
  retryDelaysMs: number[] = [1200, 2000]
): Promise<string> {
  let lastError: any = null;
  let success = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { error: uploadError } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, fileBlob, {
          contentType,
          upsert: true
        });

      if (!uploadError) {
        success = true;
        break;
      }

      lastError = uploadError;
      console.warn(
        `Banner upload attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        uploadError
      );

      // If NOT a network failure (e.g. RLS policy violation), fail immediately!
      if (!isNetworkLevelError(uploadError)) {
        break;
      }
    } catch (fetchErr: any) {
      lastError = fetchErr;
      console.warn(
        `Banner upload network exception on attempt ${attempt + 1}/${maxRetries + 1}:`,
        fetchErr
      );

      if (!isNetworkLevelError(fetchErr)) {
        break;
      }
    }

    // Wait with backoff before next retry if transient network error
    if (attempt < maxRetries) {
      const delay = retryDelaysMs[attempt] ?? 1500;
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  if (!success) {
    if (isNetworkLevelError(lastError)) {
      throw new Error('Upload failed — check your connection and try again');
    }

    const realMsg = lastError?.message || lastError?.error || 'Failed to upload event banner';
    throw new Error(`Failed to upload event banner image: ${realMsg}`);
  }

  const { data: urlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded event banner');
  }

  return urlData.publicUrl;
}
