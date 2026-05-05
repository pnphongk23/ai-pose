'use client';

import { Heart } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { blobToUrl } from '@/lib/db';

const ACCENT_COLORS = [
  'bg-accent-pink',
  'bg-accent-yellow',
  'bg-accent-blue',
  'bg-accent-green',
];

export default function PhotoCard({ photo, onClick, onToggleFavorite }) {
  const imgUrl = useMemo(() => photo.imageBlob ? blobToUrl(photo.imageBlob) : null, [photo.imageBlob]);

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  const accentColor = ACCENT_COLORS[photo.id % ACCENT_COLORS.length];
  const time = new Date(photo.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={() => onClick?.(photo)}
        className="flex w-full items-start overflow-hidden rounded-xl neo-border neo-shadow-sm aspect-square relative neo-press"
      >
        {imgUrl && (
          <img
            src={imgUrl}
            alt={photo.poseName || 'Captured photo'}
            className="w-full h-full object-cover"
          />
        )}
        {photo.poseName && (
          <div className={`flex items-center gap-1 rounded-[8px] neo-border ${accentColor} px-1.5 py-0.5 shadow-[1px_1px_0px_0px_#171717] absolute right-1.5 top-1.5`}>
            <span className="text-[8px] font-bold tracking-neo leading-[12px]">
              {photo.poseName.toUpperCase()}
            </span>
          </div>
        )}
      </button>
      <div className="flex w-full items-center justify-between px-0.5">
        <span className="text-[9px] font-semibold tracking-neo-wide opacity-50">
          {time}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(photo.id);
          }}
          className="neo-press"
        >
          <Heart
            size={10}
            className={photo.isFavorite ? 'text-accent-pink fill-accent-pink' : 'opacity-30'}
          />
        </button>
      </div>
    </div>
  );
}
