import heic2any from 'heic2any';
import { toast } from 'sonner';

/**
 * Checks whether a given file or blob is in HEIC/HEIF format (iPhone default format).
 * Checks both mime type and file extension fallback because some iOS browsers
 * report an empty or generic mime type for HEIC files.
 */
export function isHeicImage(file: File | Blob, fileName?: string): boolean {
  const name = fileName || (file instanceof File ? file.name : '');
  const type = (file.type || '').toLowerCase();
  
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence' ||
    /\.(heic|heif)$/i.test(name)
  );
}

/**
 * Validates if the selected file is an image, accepting standard formats as well as HEIC/HEIF.
 */
export function isValidImageFile(file: File): boolean {
  if (isHeicImage(file)) return true;
  if (file.type && file.type.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|webp|gif|avif|heic|heif)$/i.test(file.name);
}

/**
 * Prepares an image for upload. If the image is HEIC/HEIF, converts it
 * client-side to a standard JPEG using heic2any with quality 0.85, surfaces
 * a clear "Converting image..." loading state, and renames the extension to .jpg.
 */
export async function prepareImageForUpload(
  file: File,
  onConverting?: (converting: boolean) => void
): Promise<File> {
  if (!isHeicImage(file)) {
    return file;
  }

  let toastId: string | number | undefined;
  try {
    if (onConverting) onConverting(true);
    toastId = toast.loading('Converting image... (HEIC to JPEG)');

    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85
    });

    const blobResult = Array.isArray(converted) ? converted[0] : converted;
    const cleanName = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg';

    if (toastId) toast.dismiss(toastId);
    toast.success('Image converted to JPEG successfully!');

    return new File([blobResult], cleanName, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  } catch (err) {
    console.error('Error converting HEIC image with heic2any:', err);
    if (toastId) toast.dismiss(toastId);
    toast.error('Converting iPhone photo failed. Please select a JPEG or PNG image.');
    throw err;
  } finally {
    if (onConverting) onConverting(false);
  }
}
