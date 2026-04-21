'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Share, Heart, Camera, Bookmark, Trash2 } from 'lucide-react';
import NavButton from '@/components/NavButton';
import ActionButton from '@/components/ActionButton';
import { getPoseById, deletePose, blobToUrl } from '@/lib/db';

export default function PoseDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [pose, setPose] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPose();
  }, [id]);

  async function loadPose() {
    try {
      const p = await getPoseById(id);
      if (p) {
        setPose(p);
        if (p.imageBlob) {
          setImageUrl(blobToUrl(p.imageBlob));
        }
      }
    } catch (err) {
      console.error('Failed to load pose:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleTryPose = () => {
    router.push(`/camera?pose=${id}`);
  };

  const handleDelete = async () => {
    if (confirm('Delete this pose?')) {
      await deletePose(Number(id));
      router.push('/poses');
    }
  };

  const handleShare = async () => {
    if (navigator.share && imageUrl) {
      try {
        const blob = pose.imageBlob;
        const file = new File([blob], `${pose.name}.png`, { type: 'image/png' });
        await navigator.share({
          title: `PoseIt — ${pose.name}`,
          text: `Check out this pose: ${pose.name}`,
          files: [file],
        });
      } catch (err) {
        // User cancelled or not supported
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full neo-border border-t-accent-blue animate-spin" />
      </div>
    );
  }

  if (!pose) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <span className="text-[16px] font-extrabold tracking-neo">POSE NOT FOUND</span>
        <button
          onClick={() => router.push('/poses')}
          className="rounded-xl neo-border bg-accent-blue px-5 py-2.5 neo-shadow-md neo-press text-[12px] font-bold tracking-neo"
        >
          BACK TO POSES
        </button>
      </div>
    );
  }

  const createdDate = new Date(pose.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6 page-enter safe-top">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <NavButton />
          <h1 className="text-[16px] font-extrabold tracking-neo-wide uppercase">
            {pose.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NavButton icon={Share} onClick={handleShare} />
        </div>
      </div>

      {/* Pose Preview */}
      <div className="flex-1 min-h-0 flex flex-col gap-5">
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-2xl neo-border bg-white neo-shadow-lg relative">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={pose.name}
              className="max-w-full max-h-full object-contain p-6 invert"
            />
          )}
          {/* Like button */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-[10px] neo-border bg-accent-pink px-2.5 py-1 neo-shadow-sm neo-press">
            <Heart size={10} />
            <span className="text-[11px] font-bold">
              {pose.likes || 0}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[18px] font-extrabold tracking-neo uppercase">
                {pose.name}
              </span>
              <span className="text-[11px] font-medium opacity-50">
                by you · {createdDate}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl neo-border bg-white px-3 py-1">
              <Camera size={11} />
              <span className="text-[10px] font-bold tracking-neo">
                0 TRIES
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl neo-border bg-white px-3 py-1">
              <Bookmark size={11} />
              <span className="text-[10px] font-bold tracking-neo">
                SAVED
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-text-primary opacity-15" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ActionButton
              onClick={handleTryPose}
              icon={Camera}
              bg="bg-accent-pink"
            >
              TRY POSE
            </ActionButton>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 rounded-xl neo-border bg-bg-primary px-4 py-3 neo-shadow-lg neo-press"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
