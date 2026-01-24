import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { hapticSuccess, hapticError } from '@/lib/haptics';

interface PhotoDropzoneProps {
  value?: string;
  onChange: (url: string | null) => void;
  onFileSelect: (file: File) => Promise<string | null>;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'large' | 'hero';
}

export function PhotoDropzone({
  value,
  onChange,
  onFileSelect,
  label = 'Photo',
  hint = 'Cliquez ou glissez une image',
  required = false,
  disabled = false,
  className,
  size = 'default',
}: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    default: 'min-h-[160px]',
    large: 'min-h-[200px]',
    hero: 'min-h-[280px] sm:min-h-[320px]',
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    } else {
      hapticError();
    }
  }, [disabled]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await onFileSelect(file);
      if (url) {
        setIsAnimating(true);
        hapticSuccess();
        onChange(url);
        setTimeout(() => setIsAnimating(false), 400);
      }
    } catch (error) {
      hapticError();
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !value) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="form-label-industrial flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "photo-dropzone",
          sizeClasses[size],
          isDragging && "active",
          value && "has-image",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <Camera className="absolute inset-0 m-auto h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Traitement en cours...
            </p>
          </div>
        ) : value ? (
          <div className={cn(
            "relative w-full h-full p-3",
            isAnimating && "animate-photo-snap"
          )}>
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-contain rounded-xl"
            />
            
            {/* Success Badge */}
            <div className="photo-success-badge">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
            
            {/* Remove Button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className={cn(
              "relative flex items-center justify-center",
              "w-20 h-20 rounded-2xl",
              "bg-primary/10 border-2 border-dashed border-primary/30",
              "transition-all duration-300",
              isDragging && "scale-110 bg-primary/20 border-primary/50"
            )}>
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary animate-bounce" />
              ) : (
                <Camera className="h-8 w-8 text-primary" />
              )}
              
              {/* Pulse Ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse-ring" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isDragging ? 'Déposez la photo ici' : hint}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG jusqu'à 10MB
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 mt-2"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <ImageIcon className="h-4 w-4" />
              Sélectionner
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
