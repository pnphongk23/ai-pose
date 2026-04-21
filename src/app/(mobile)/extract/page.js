'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Cpu, Download, Upload, Image as ImageIcon } from 'lucide-react';
import NavButton from '@/components/NavButton';
import ActionButton from '@/components/ActionButton';
import ProgressBar from '@/components/ProgressBar';
import { addPose, createThumbnail } from '@/lib/db';
import { extractPoseServer } from '@/lib/extractPose';

export default function ExtractPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [extractedPose, setExtractedPose] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | extracting | done | error
  const [poseName, setPoseName] = useState('');
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setExtractedPose(null);
    setProgress(0);
    setStatus('idle');
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!imageFile) return;

    setStatus('extracting');
    setProgress(0);
    setError(null);

    try {
      const poseBlob = await extractPoseServer(imageFile, (p) => {
        setProgress(p);
      });

      setExtractedPose(poseBlob);
      setStatus('done');
      setProgress(100);
    } catch (err) {
      console.error('Extraction failed:', err);
      setError(err.message);
      setStatus('error');
    }
  }, [imageFile]);

  const handleSave = useCallback(async () => {
    if (!extractedPose) return;

    const name = poseName.trim() || `Pose ${Date.now()}`;
    const thumbnail = await createThumbnail(extractedPose, 200);

    // Also save original image as blob
    const originalBlob = await fetch(selectedImage).then(r => r.blob());

    await addPose({
      name,
      imageBlob: extractedPose,
      thumbnailBlob: thumbnail,
      originalImageBlob: originalBlob,
    });

    router.push('/poses');
  }, [extractedPose, poseName, selectedImage, router]);

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6 page-enter safe-top">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <NavButton />
          <h1 className="text-[18px] font-extrabold tracking-neo uppercase">
            EXTRACT
          </h1>
        </div>
        <NavButton icon={Info} bg="bg-accent-green" onClick={() => {}} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Image Preview Area */}
        <div className="flex-1 min-h-0 relative">
          {!selectedImage ? (
            /* Upload Placeholder */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-4 rounded-2xl neo-border bg-white neo-shadow-lg neo-press"
            >
              <div className="w-16 h-16 rounded-2xl neo-border bg-accent-yellow neo-shadow-sm flex items-center justify-center">
                <Upload size={28} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[14px] font-extrabold tracking-neo uppercase">
                  UPLOAD IMAGE
                </span>
                <span className="text-[11px] font-medium opacity-50">
                  Tap to select a photo with a person
                </span>
              </div>
            </button>
          ) : (
            /* Image with overlay */
            <div className="w-full h-full overflow-hidden rounded-2xl neo-border neo-shadow-lg relative">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-full object-cover"
              />
              {/* Dark overlay during processing */}
              {status === 'extracting' && (
                <div className="absolute inset-0 bg-bg-dark opacity-20" />
              )}
              {/* Extracted pose overlay */}
              {extractedPose && (
                <img
                  src={URL.createObjectURL(extractedPose)}
                  alt="Pose overlay"
                  className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                />
              )}
              {/* Status badge */}
              {status === 'extracting' && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-[10px] neo-border bg-accent-yellow px-3 py-1.5 neo-shadow-sm animate-progress-pulse">
                  <Cpu size={12} />
                  <span className="text-[10px] font-bold tracking-neo-wide">
                    DETECTING...
                  </span>
                </div>
              )}
              {status === 'done' && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-[10px] neo-border bg-accent-green px-3 py-1.5 neo-shadow-sm">
                  <span className="text-[10px] font-bold tracking-neo-wide">
                    ✓ DONE
                  </span>
                </div>
              )}
              {/* Change image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-[10px] neo-border bg-white px-2.5 py-1 neo-press"
              >
                <ImageIcon size={10} />
                <span className="text-[10px] font-bold tracking-neo">
                  CHANGE
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {/* Progress Bar - visible during extraction */}
          {(status === 'extracting' || status === 'done') && (
            <ProgressBar
              progress={progress}
              label="EXTRACTING POSE"
              className="px-1"
            />
          )}

          {/* Pose Name Input - visible after extraction */}
          {status === 'done' && (
            <div className="px-1">
              <input
                type="text"
                value={poseName}
                onChange={(e) => setPoseName(e.target.value)}
                placeholder="Name your pose..."
                className="w-full px-4 py-2.5 rounded-xl neo-border bg-white text-[13px] font-bold tracking-neo
                  placeholder:opacity-40 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="px-1">
              <div className="flex items-center gap-2 rounded-xl neo-border bg-accent-pink px-4 py-2">
                <span className="text-[11px] font-bold">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 px-1">
            {status === 'idle' && selectedImage && (
              <ActionButton
                onClick={handleExtract}
                icon={Cpu}
                bg="bg-accent-yellow"
              >
                EXTRACT POSE
              </ActionButton>
            )}
            {status === 'done' && (
              <ActionButton
                onClick={handleSave}
                icon={Download}
                bg="bg-accent-pink"
              >
                SAVE POSE
              </ActionButton>
            )}
            {status === 'error' && (
              <ActionButton
                onClick={handleExtract}
                icon={Cpu}
                bg="bg-accent-yellow"
              >
                RETRY
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
