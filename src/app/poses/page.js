'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Shield } from 'lucide-react';
import NavButton from '@/components/NavButton';
import TabSwitcher from '@/components/TabSwitcher';
import PoseCard from '@/components/PoseCard';
import { getAllPoses, addPose, createThumbnail } from '@/lib/db';
import { generatePoseBlob } from '@/lib/demoPoses';

const TABS = [
  { id: 'mine', label: 'MY POSES' },
  { id: 'community', label: 'COMMUNITY' },
];

// Demo community poses (placeholder)
const COMMUNITY_POSES = [
  { id: 'c1', name: 'STANDING', isMine: false, likes: 2100, thumbnailBlob: null },
  { id: 'c2', name: 'DANCING', isMine: false, likes: 856, thumbnailBlob: null },
  { id: 'c3', name: 'JUMPING', isMine: false, likes: 423, thumbnailBlob: null },
  { id: 'c4', name: 'WALKING', isMine: false, likes: 1500, thumbnailBlob: null },
  { id: 'c5', name: 'ARMS UP', isMine: false, likes: 320, thumbnailBlob: null },
  { id: 'c6', name: 'SITTING', isMine: false, likes: 190, thumbnailBlob: null },
];

export default function PosesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mine');
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    loadPoses();
  }, []);

  async function loadPoses() {
    try {
      const allPoses = await getAllPoses();
      setPoses(allPoses);
    } catch (err) {
      console.error('Failed to load poses:', err);
    } finally {
      setLoading(false);
    }
  }

  const displayPoses = activeTab === 'mine' ? poses : COMMUNITY_POSES;
  const poseCount = displayPoses.length;

  const handlePoseClick = async (pose) => {
    // User's own poses → detail page
    if (typeof pose.id === 'number') {
      router.push(`/pose/${pose.id}`);
      return;
    }

    // Community poses → generate demo stick figure, save to DB, go to camera
    if (navigating) return;
    setNavigating(true);

    try {
      const poseBlob = await generatePoseBlob(pose.name);
      const thumbnail = await createThumbnail(poseBlob, 200);
      const savedId = await addPose({
        name: pose.name,
        imageBlob: poseBlob,
        thumbnailBlob: thumbnail,
        originalImageBlob: null,
      });
      router.push(`/camera?pose=${savedId}`);
    } catch (err) {
      console.error('Failed to generate demo pose:', err);
      setNavigating(false);
    }
  };

  return (
    <div className="h-full flex flex-col page-enter safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-[22px] font-extrabold tracking-neo uppercase">
          POSES
        </h1>
        <div className="flex items-center gap-2">
          <NavButton icon={Shield} href="/admin/keys" />
          <NavButton icon={Search} onClick={() => {}} />
          <NavButton icon={Plus} bg="bg-accent-yellow" href="/extract" />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-5 pb-4">
        <TabSwitcher
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-hide px-4 pb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1 pb-3">
          <span className="text-[11px] font-bold tracking-neo-widest uppercase">
            {activeTab === 'mine' ? 'RECENT' : 'TRENDING'}
          </span>
          <span className="text-[10px] font-medium tracking-neo-wider opacity-40">
            {poseCount} POSES
          </span>
        </div>

        {/* Loading overlay for community click */}
        {navigating && (
          <div className="fixed inset-0 z-50 bg-bg-primary/80 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full neo-border border-t-accent-blue animate-spin" />
            <span className="text-[12px] font-bold tracking-neo-wide">
              GENERATING POSE...
            </span>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full neo-border border-t-accent-blue animate-spin" />
              <span className="text-[11px] font-bold tracking-neo-wide opacity-50">
                LOADING...
              </span>
            </div>
          </div>
        ) : poseCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-2xl neo-border bg-white neo-shadow-md flex items-center justify-center">
              <div className="flex flex-col items-center opacity-30">
                <div className="w-6 h-6 rounded-full neo-border" />
                <div className="w-0.5 h-8 bg-text-primary" />
                <div className="flex gap-2">
                  <div className="w-6 h-0.5 bg-text-primary -rotate-[30deg]" />
                  <div className="w-6 h-0.5 bg-text-primary rotate-[30deg]" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[14px] font-extrabold tracking-neo">
                NO POSES YET
              </span>
              <span className="text-[11px] font-medium opacity-50">
                Tap + to extract your first pose
              </span>
            </div>
            <button
              onClick={() => router.push('/extract')}
              className="flex items-center gap-2 rounded-xl neo-border bg-accent-yellow px-5 py-2.5 neo-shadow-md neo-press"
            >
              <Plus size={14} />
              <span className="text-[12px] font-bold tracking-neo">
                EXTRACT POSE
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayPoses.map((pose) => (
              <PoseCard
                key={pose.id}
                pose={pose}
                onClick={handlePoseClick}
              />
            ))}
          </div>
        )}

        {/* Community placeholder message */}
        {activeTab === 'community' && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 rounded-xl neo-border bg-accent-green px-4 py-2 neo-shadow-sm">
              <span className="text-[10px] font-bold tracking-neo">
                TAP A POSE TO TRY IT WITH YOUR CAMERA
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
