'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Users, User } from 'lucide-react';
import { getPoseById, addPhoto, blobToUrl, getAllPhotos } from '@/lib/db';

function CameraContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poseIdParam = searchParams.get('pose');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const overlayRef = useRef(null);

  const [pose, setPose] = useState(null);
  const [poseImgUrl, setPoseImgUrl] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [lastPhotoUrl, setLastPhotoUrl] = useState(null);

  // Gesture state
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const gestureRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    initialScale: 1,
  });

  // Load pose
  useEffect(() => {
    if (poseIdParam) {
      loadPose(poseIdParam);
    }
  }, [poseIdParam]);

  // Load last photo for gallery thumbnail
  useEffect(() => {
    loadLastPhoto();
  }, []);

  async function loadPose(id) {
    try {
      const p = await getPoseById(id);
      if (p) {
        setPose(p);
        setPoseImgUrl(blobToUrl(p.imageBlob));
      }
    } catch (err) {
      console.error('Failed to load pose:', err);
    }
  }

  async function loadLastPhoto() {
    try {
      const photos = await getAllPhotos();
      if (photos.length > 0) {
        setLastPhotoUrl(blobToUrl(photos[0].imageBlob));
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  async function startCamera() {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      // Show fallback
      setCameraReady(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  // Capture photo (WITHOUT overlay)
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !cameraReady) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 400);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Draw ONLY the video frame (no overlay!)
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (blob) {
        await addPhoto({
          imageBlob: blob,
          poseId: pose?.id || null,
          poseName: pose?.name || 'Free',
        });

        // Update gallery thumbnail
        setLastPhotoUrl(blobToUrl(blob));
      }
    }, 'image/jpeg', 0.92);
  }, [cameraReady, pose]);

  // Remove overlay
  const handleRemoveOverlay = () => {
    setPose(null);
    setPoseImgUrl(null);
    setOverlayScale(1);
    setOverlayPos({ x: 0, y: 0 });
  };

  // Touch gesture handlers for overlay
  const handleTouchStart = useCallback((e) => {
    if (!poseImgUrl) return;

    const touches = e.touches;
    if (touches.length === 1) {
      gestureRef.current.dragging = true;
      gestureRef.current.lastX = touches[0].clientX;
      gestureRef.current.lastY = touches[0].clientY;
    } else if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      gestureRef.current.initialDistance = Math.sqrt(dx * dx + dy * dy);
      gestureRef.current.initialScale = overlayScale;
    }
  }, [poseImgUrl, overlayScale]);

  const handleTouchMove = useCallback((e) => {
    if (!poseImgUrl) return;
    e.preventDefault();

    const touches = e.touches;
    if (touches.length === 1 && gestureRef.current.dragging) {
      const dx = touches[0].clientX - gestureRef.current.lastX;
      const dy = touches[0].clientY - gestureRef.current.lastY;
      gestureRef.current.lastX = touches[0].clientX;
      gestureRef.current.lastY = touches[0].clientY;
      setOverlayPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = (distance / gestureRef.current.initialDistance) * gestureRef.current.initialScale;
      setOverlayScale(Math.max(0.3, Math.min(3, scale)));
    }
  }, [poseImgUrl]);

  const handleTouchEnd = useCallback(() => {
    gestureRef.current.dragging = false;
  }, []);

  return (
    <div className="h-full flex flex-col bg-bg-dark safe-top">
      {/* Camera View */}
      <div className="flex-1 min-h-0 px-3 pt-3">
        <div
          className="w-full h-full overflow-hidden rounded-3xl border-2 border-neutral-700 relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-bg-dark opacity-20 pointer-events-none" />

          {/* Rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[33%] top-0 bottom-0 w-px bg-white opacity-15" />
            <div className="absolute left-[66%] top-0 bottom-0 w-px bg-white opacity-15" />
            <div className="absolute top-[33%] left-0 right-0 h-px bg-white opacity-15" />
            <div className="absolute top-[66%] left-0 right-0 h-px bg-white opacity-15" />
          </div>

          {/* Pose overlay */}
          {poseImgUrl && (
            <img
              ref={overlayRef}
              src={poseImgUrl}
              alt="Pose overlay"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none pose-glow"
              style={{
                opacity: overlayOpacity,
                transform: `translate(${overlayPos.x}px, ${overlayPos.y}px) scale(${overlayScale})`,
                transition: gestureRef.current.dragging ? 'none' : 'transform 0.1s ease-out',
              }}
            />
          )}

          {/* Pose name badge */}
          {pose && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-[10px] neo-border bg-accent-yellow px-2.5 py-1 neo-shadow-sm">
              <User size={10} />
              <span className="text-[11px] font-bold tracking-neo">
                {pose.name?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Remove overlay button */}
          {poseImgUrl && (
            <button
              onClick={handleRemoveOverlay}
              className="absolute left-3 bottom-3 h-10 w-10 flex items-center justify-center rounded-[10px] border-2 border-neutral-700 bg-bg-dark opacity-80 neo-press"
            >
              <Trash2 size={16} className="text-white" />
            </button>
          )}

          {/* Opacity slider (bottom center above nav) */}
          {poseImgUrl && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <input
                type="range"
                min="10"
                max="100"
                value={overlayOpacity * 100}
                onChange={(e) => setOverlayOpacity(e.target.value / 100)}
                className="w-24 h-1 accent-white opacity-60"
              />
            </div>
          )}

          {/* Flash effect */}
          {flash && (
            <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
          )}

          {/* Camera not available */}
          {!cameraReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-dark">
              <div className="w-16 h-16 rounded-2xl border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center">
                <span className="text-[24px]">📷</span>
              </div>
              <span className="text-[12px] font-bold tracking-neo text-white opacity-60">
                CAMERA ACCESS REQUIRED
              </span>
              <span className="text-[10px] font-medium text-white opacity-40 text-center px-8">
                Please allow camera access in your browser settings
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-end justify-around px-4 pt-5 pb-4 safe-bottom">
        {/* Gallery */}
        <button
          onClick={() => router.push('/gallery')}
          className="flex flex-col items-center gap-1.5 neo-press"
        >
          <div className="h-12 w-12 overflow-hidden rounded-[10px] border-2 border-white neo-shadow-sm shadow-accent-yellow">
            {lastPhotoUrl ? (
              <img src={lastPhotoUrl} alt="Gallery" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <span className="text-[18px]">🖼️</span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-neo-wider text-white">
            GALLERY
          </span>
        </button>

        {/* Capture Button */}
        <button
          onClick={handleCapture}
          disabled={!cameraReady}
          className="flex flex-col items-center mb-1 neo-press disabled:opacity-30"
        >
          <div className="h-16 w-16 flex items-center justify-center rounded-[18px] border-2 border-white bg-bg-dark p-1 shadow-[4px_4px_0px_0px_#e7a1b0]">
            <div className="flex-1 self-stretch rounded-[13px] border-2 border-white bg-accent-pink" />
          </div>
        </button>

        {/* Poses */}
        <button
          onClick={() => router.push('/poses')}
          className="flex flex-col items-center gap-1.5 neo-press"
        >
          <div className="h-12 w-12 flex items-center justify-center rounded-[10px] border-2 border-white bg-accent-blue shadow-[3px_3px_0px_0px_#f4c542]">
            <Users size={22} />
          </div>
          <span className="text-[10px] font-semibold tracking-neo-wider text-white">
            POSES
          </span>
        </button>
      </div>
    </div>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-bg-dark">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-accent-blue animate-spin" />
      </div>
    }>
      <CameraContent />
    </Suspense>
  );
}
