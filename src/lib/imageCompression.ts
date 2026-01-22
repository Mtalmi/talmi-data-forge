/**
 * Image compression utilities for optimizing uploads
 * Reduces file sizes before sending to storage
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  outputType: 'image/jpeg',
};

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip compression for small files (< 200KB)
  if (file.size < 200 * 1024) {
    return file;
  }

  // Skip non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        const maxW = opts.maxWidth!;
        const maxH = opts.maxHeight!;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw with high quality
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with same name
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: opts.outputType }
              );
              
              // Only use compressed if smaller
              if (compressedFile.size < file.size) {
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            } else {
              resolve(file);
            }
          },
          opts.outputType,
          opts.quality
        );
      } catch (error) {
        console.error('Image compression error:', error);
        resolve(file); // Return original on error
      }
    };

    img.onerror = () => {
      console.error('Failed to load image for compression');
      resolve(file); // Return original on error
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get estimated file size after compression
 */
export function estimateCompressedSize(originalSize: number): number {
  // Rough estimate: JPEG compression typically achieves 60-80% reduction
  return Math.round(originalSize * 0.3);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
