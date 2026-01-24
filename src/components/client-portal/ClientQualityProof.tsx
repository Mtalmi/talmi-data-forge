import { useState } from 'react';
import { Shield, CheckCircle, Image, ZoomIn, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientQualityProofProps {
  slumpPhotoUrl: string | null;
  texturePhotoUrl: string | null;
  affaissement: number | null;
  isConforming: boolean | null;
  approvedBy: string | null;
}

export function ClientQualityProof({
  slumpPhotoUrl,
  texturePhotoUrl,
  affaissement,
  isConforming,
  approvedBy,
}: ClientQualityProofProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const photos = [
    { url: slumpPhotoUrl, label: 'Test Affaissement', type: 'slump' },
    { url: texturePhotoUrl, label: 'Texture Béton', type: 'texture' },
  ].filter(p => p.url);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-amber-400/80 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Preuve Qualité
          </h3>
          <div className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
            isConforming 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          )}>
            <CheckCircle className="h-3 w-3" />
            <span>{isConforming ? 'Conforme' : 'Vérifié'}</span>
          </div>
        </div>

        {/* Affaissement Badge */}
        {affaissement !== null && (
          <div className="mb-3 flex items-center justify-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="text-xs text-gray-400">Affaissement:</span>
            <span className="text-lg font-bold text-emerald-400">{affaissement} mm</span>
          </div>
        )}

        {/* Photo Grid */}
        <div className={cn(
          "grid gap-2",
          photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedPhoto(photo.url)}
              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-800 hover:border-amber-500/50 transition-colors"
            >
              <img
                src={photo.url!}
                alt={photo.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-white font-medium">{photo.label}</span>
                <ZoomIn className="h-4 w-4 text-amber-400" />
              </div>
              <div className="absolute top-2 right-2">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Approved By */}
        {approvedBy && (
          <p className="mt-3 text-[10px] text-gray-500 text-center">
            Validé par: <span className="text-gray-400">{approvedBy}</span>
          </p>
        )}
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={selectedPhoto}
            alt="Photo qualité"
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
