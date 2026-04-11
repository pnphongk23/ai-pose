'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { blobToUrl } from '@/lib/db';
import Badge from './Badge';

export default function PoseCard({ pose, onClick }) {
  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    if (pose.thumbnailBlob) {
      const url = blobToUrl(pose.thumbnailBlob);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pose.thumbnailBlob]);

  const badgeType = pose.isMine ? 'mine' : (pose.likes > 1000 ? 'hot' : 'new');
  const badgeLabel = pose.isMine ? 'MINE' : (pose.likes > 1000 ? 'HOT' : 'NEW');

  return (
    <button
      onClick={() => onClick?.(pose)}
      className="flex flex-col items-center gap-2 w-full text-left neo-press"
    >
      <div className="flex w-full items-center justify-center overflow-hidden rounded-xl neo-border bg-white neo-shadow-md aspect-square relative">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={pose.name}
            className="w-full h-full object-contain p-3 invert"
          />
        ) : (
          <div className="flex flex-col items-center opacity-30">
            <div className="flex h-5 w-5 rounded-full neo-border" />
            <div className="flex h-10 w-0.5 bg-text-primary" />
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5">
          <Badge type={badgeType} label={badgeLabel} />
        </div>
        {pose.likes > 0 && (
          <div className="flex items-center gap-0.5 absolute top-1.5 right-1.5">
            <Heart size={10} className="opacity-40" />
            <span className="text-[8px] font-semibold opacity-40">
              {pose.likes >= 1000 ? `${(pose.likes / 1000).toFixed(1)}k` : pose.likes}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold tracking-neo-wide uppercase">
        {pose.name}
      </span>
    </button>
  );
}
