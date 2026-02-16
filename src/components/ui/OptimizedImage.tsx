import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad'> {
  /** Low-res placeholder or base64 blur hash */
  placeholder?: string;
  /** Fallback src if main fails */
  fallbackSrc?: string;
}

/**
 * Optimized image with:
 * - Native lazy loading
 * - Blur-up placeholder transition
 * - Error fallback
 * - Fade-in on load
 */
export function OptimizedImage({
  src,
  alt = '',
  placeholder,
  fallbackSrc,
  className,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If image is already cached, skip animation
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const displaySrc = error && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
        />
      )}
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />
    </div>
  );
}
