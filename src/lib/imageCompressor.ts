export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  savedPercent: number;
  summary: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Compresses and converts an image File to WebP in the browser using HTML5 Canvas.
 * Runs 100% client-side so it uses zero VPS CPU.
 */
export async function compressImageToWebP(
  inputFile: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.8 } = options;
  const originalSize = inputFile.size;

  // Skip compression for SVGs
  if (inputFile.type === 'image/svg+xml') {
    return {
      file: inputFile,
      originalSize,
      compressedSize: originalSize,
      width: 0,
      height: 0,
      savedPercent: 0,
      summary: `${formatBytes(originalSize)} (SVG)`,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(inputFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      // Scale down proportionally if larger than maxWidth / maxHeight
      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          file: inputFile,
          originalSize,
          compressedSize: originalSize,
          width: targetWidth,
          height: targetHeight,
          savedPercent: 0,
          summary: `${formatBytes(originalSize)}`,
        });
        return;
      }

      // High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file: inputFile,
              originalSize,
              compressedSize: originalSize,
              width: targetWidth,
              height: targetHeight,
              savedPercent: 0,
              summary: `${formatBytes(originalSize)}`,
            });
            return;
          }

          const baseName = inputFile.name.replace(/\.[^/.]+$/, '') || 'image';
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const compressedSize = webpFile.size;
          const savedPercent =
            originalSize > 0
              ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
              : 0;

          const summary =
            savedPercent > 0
              ? `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} WebP (-${savedPercent}%)`
              : `${formatBytes(compressedSize)} WebP (${targetWidth}×${targetHeight})`;

          resolve({
            file: webpFile,
            originalSize,
            compressedSize,
            width: targetWidth,
            height: targetHeight,
            savedPercent,
            summary,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file: inputFile,
        originalSize,
        compressedSize: originalSize,
        width: 0,
        height: 0,
        savedPercent: 0,
        summary: `${formatBytes(originalSize)}`,
      });
    };

    img.src = objectUrl;
  });
}
