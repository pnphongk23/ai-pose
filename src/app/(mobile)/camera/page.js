'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Users, User, MoreHorizontal, Zap, Grid3X3, RefreshCw } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(true);

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
    <div className="h-full flex flex-col bg-bg-primary safe-top">
      {/* Top Header */}
      <div className="flex items-center justify-center gap-2 py-3">
        <div className="flex h-2 w-2 items-start rounded-[4px] bg-neutral-900" />
        <span className="font-['Inter'] text-[12px] font-[700] leading-[16px] text-neutral-900 tracking-[0.1em]">
          CAMERA SCREEN
        </span>
      </div>

      {/* Camera View */}
      <div className="flex-1 min-h-0 px-4 pb-2 pt-1 flex flex-col">
        <div
          className="flex-1 overflow-hidden rounded-[48px] neo-border bg-[#f6f1e8] neo-shadow-xl relative"
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
          {isGridOpen && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[33%] top-0 bottom-0 w-px bg-neutral-900 opacity-20" />
              <div className="absolute left-[66%] top-0 bottom-0 w-px bg-neutral-900 opacity-20" />
              <div className="absolute top-[33%] left-0 right-0 h-px bg-neutral-900 opacity-20" />
              <div className="absolute top-[66%] left-0 right-0 h-px bg-neutral-900 opacity-20" />
            </div>
          )}

          {/* Center Crosshair */}
          <div className="flex flex-col items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 pointer-events-none">
            <div className="flex h-10 w-10 flex-none items-start rounded-full border-2 border-solid border-neutral-900 shadow-[0px_0px_12px_2px_rgba(23,23,23,0.6)]" />
            <div className="flex h-20 w-px flex-none items-start bg-neutral-900 shadow-[0px_0px_8px_2px_rgba(23,23,23,0.4)]" />
            <div className="flex items-start -translate-y-14">
              <div className="flex h-px w-16 flex-none items-start bg-neutral-900 shadow-[0px_0px_8px_2px_rgba(23,23,23,0.4)] -rotate-[50deg] -translate-x-2" />
              <div className="flex h-px w-16 flex-none items-start bg-neutral-900 shadow-[0px_0px_8px_2px_rgba(23,23,23,0.4)] rotate-[30deg] translate-x-2" />
            </div>
            <div className="flex items-start -translate-y-1">
              <div className="flex h-px w-20 flex-none items-start bg-neutral-900 shadow-[0px_0px_8px_2px_rgba(23,23,23,0.4)] -rotate-[60deg]" />
              <div className="flex h-px w-20 flex-none items-start bg-neutral-900 shadow-[0px_0px_8px_2px_rgba(23,23,23,0.4)] rotate-[20deg]" />
            </div>
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
            <div className="absolute right-16 top-4 flex items-center gap-1.5 rounded-[10px] neo-border bg-accent-yellow px-2.5 py-1.5 neo-shadow-sm">
              <User size={12} className="text-neutral-900" />
              <span className="text-[11px] font-bold tracking-neo text-neutral-900">
                {pose.name?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Top Right Actions */}
          <div className="flex flex-col items-end gap-2 absolute right-4 top-4 z-20">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] neo-border bg-bg-primary px-2 py-2 neo-shadow-sm neo-press"
            >
              <MoreHorizontal size={18} className="text-neutral-900" />
            </button>
            
            {isMenuOpen && (
              <div className="flex w-36 flex-col items-stretch rounded-2xl neo-border bg-bg-dark px-1.5 py-1.5 neo-shadow-md origin-top-right animate-fade-in">
                <div className="flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-white" />
                    <span className="font-['Inter'] text-[11px] font-[600] leading-[16px] text-white tracking-[0.06em]">Flash</span>
                  </div>
                  <span className="font-['Inter'] text-[10px] font-[700] leading-[14px] text-accent-yellow tracking-neo-wide">AUTO</span>
                </div>
                <div className="flex h-px w-full flex-none bg-white opacity-10 my-1" />
                <div 
                  className="flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => setIsGridOpen(!isGridOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Grid3X3 size={14} className="text-white" />
                    <span className="font-['Inter'] text-[11px] font-[600] leading-[16px] text-white tracking-[0.06em]">Grid</span>
                  </div>
                  <div className={`flex h-4 w-7 flex-none items-center rounded-full px-0.5 transition-colors ${isGridOpen ? 'bg-accent-blue' : 'bg-neutral-600'}`}>
                    <div className={`flex h-3 w-3 flex-none items-start rounded-full bg-white transition-transform ${isGridOpen ? 'ml-auto' : ''}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remove overlay button */}
          {poseImgUrl && (
            <button
              onClick={handleRemoveOverlay}
              className="absolute left-4 bottom-4 h-10 w-10 flex items-center justify-center rounded-[10px] border-2 border-neutral-700 bg-bg-primary opacity-80 neo-press z-10"
            >
              <Trash2 size={16} className="text-neutral-900" />
            </button>
          )}

          {/* Opacity slider (bottom center above nav) */}
          {poseImgUrl && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
              <input
                type="range"
                min="10"
                max="100"
                value={overlayOpacity * 100}
                onChange={(e) => setOverlayOpacity(e.target.value / 100)}
                className="w-24 h-1 accent-neutral-900 opacity-80"
              />
            </div>
          )}

          {/* Center 1x Button */}
          <button className="flex h-9 w-9 flex-none items-center justify-center rounded-full neo-border bg-bg-primary neo-shadow-sm absolute bottom-4 left-1/2 -translate-x-1/2 z-10 neo-press">
            <span className="text-[12px] font-[700] text-neutral-900 leading-[16px]">1x</span>
          </button>
          
          {/* View Poses button inside camera feed */}
          <button 
            onClick={() => router.push('/poses')}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full neo-border bg-accent-blue neo-shadow-sm absolute right-4 bottom-4 z-10 neo-press"
          >
            <Users size={16} className="text-neutral-900" />
          </button>

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
      <div className="flex w-full items-center justify-between px-6 pt-3 pb-6 safe-bottom">
        <button
          onClick={() => router.push('/gallery')}
          className="flex h-14 w-14 flex-none flex-col items-center justify-center overflow-hidden rounded-xl neo-border bg-neutral-800 neo-shadow-sm shadow-[#f4c542] neo-press"
        >
          {lastPhotoUrl ? (
            <img src={lastPhotoUrl} alt="Gallery" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[20px]">🖼️</span>
          )}
        </button>

        <div className="flex flex-col items-center">
          <button
            onClick={handleCapture}
            disabled={!cameraReady}
            className="flex h-16 w-16 flex-none items-center justify-center rounded-[18px] neo-border bg-bg-primary p-1 shadow-[4px_4px_0px_0px_#e7a1b0] neo-press disabled:opacity-50"
          >
            <div className="flex grow shrink-0 basis-0 items-center justify-center self-stretch rounded-[13px] neo-border bg-accent-pink" />
          </button>
        </div>

        <button
          onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
          className="flex h-14 w-14 flex-none items-center justify-center rounded-xl neo-border bg-bg-primary neo-shadow-sm shadow-[#f4c542] neo-press"
        >
          <RefreshCw size={24} className="text-neutral-900" />
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
