'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LayoutGrid, List, Trash2, Download } from 'lucide-react';
import NavButton from '@/components/NavButton';
import PhotoCard from '@/components/PhotoCard';
import { getAllPhotos, togglePhotoFavorite, deletePhoto, blobToUrl } from '@/lib/db';

export default function GalleryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const allPhotos = await getAllPhotos();
      setPhotos(allPhotos);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFavorite = async (id) => {
    await togglePhotoFavorite(id);
    loadPhotos();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this photo?')) {
      await deletePhoto(id);
      setSelectedPhoto(null);
      loadPhotos();
    }
  };

  const handleDownload = (photo) => {
    const url = blobToUrl(photo.imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poseit-${photo.poseName || 'photo'}-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group photos by date
  const groupedPhotos = photos.reduce((groups, photo) => {
    const date = new Date(photo.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (date.toDateString() === today.toDateString()) {
      label = 'TODAY';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'YESTERDAY';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(photo);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col page-enter safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <NavButton />
          <h1 className="text-[22px] font-extrabold tracking-neo uppercase">
            GALLERY
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NavButton
            icon={LayoutGrid}
            bg={viewMode === 'grid' ? 'bg-accent-blue' : 'bg-bg-primary'}
            onClick={() => setViewMode('grid')}
          />
          <NavButton
            icon={List}
            bg={viewMode === 'list' ? 'bg-accent-blue' : 'bg-bg-primary'}
            onClick={() => setViewMode('list')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-hide px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full neo-border border-t-accent-blue animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-2xl neo-border bg-white neo-shadow-md flex items-center justify-center">
              <span className="text-[32px]">📸</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[14px] font-extrabold tracking-neo">
                NO PHOTOS YET
              </span>
              <span className="text-[11px] font-medium opacity-50">
                Take your first pose photo
              </span>
            </div>
            <button
              onClick={() => router.push('/camera')}
              className="flex items-center gap-2 rounded-xl neo-border bg-accent-pink px-5 py-2.5 neo-shadow-md neo-press"
            >
              <span className="text-[12px] font-bold tracking-neo">
                OPEN CAMERA
              </span>
            </button>
          </div>
        ) : (
          Object.entries(groupedPhotos).map(([label, groupPhotos]) => (
            <div key={label} className="mb-5">
              {/* Date header */}
              <div className="flex items-center justify-between px-1 pb-2.5">
                <span className="text-[11px] font-bold tracking-neo-widest">
                  {label}
                </span>
                <span className="text-[10px] font-medium tracking-neo-wider opacity-40">
                  {groupPhotos.length} PHOTOS
                </span>
              </div>

              {/* Photo grid */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-3'}>
                {groupPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={(p) => setSelectedPhoto(p)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div className="absolute inset-0 bg-bg-dark/90 flex flex-col items-center justify-center z-50 animate-fade-in">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 left-4 flex items-center gap-2 rounded-[10px] neo-border bg-bg-primary px-3 py-1.5 neo-shadow-sm neo-press"
          >
            <ChevronLeft size={14} />
            <span className="text-[11px] font-bold tracking-neo">BACK</span>
          </button>

          <div className="w-full max-w-[380px] px-4">
            <div className="w-full overflow-hidden rounded-2xl neo-border neo-shadow-lg">
              <img
                src={blobToUrl(selectedPhoto.imageBlob)}
                alt={selectedPhoto.poseName}
                className="w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl neo-border bg-accent-blue px-4 py-3 neo-shadow-lg neo-press"
              >
                <Download size={14} />
                <span className="text-[13px] font-bold tracking-neo">SAVE</span>
              </button>
              <button
                onClick={() => handleDelete(selectedPhoto.id)}
                className="flex items-center justify-center rounded-xl neo-border bg-accent-pink px-4 py-3 neo-shadow-lg neo-press"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
