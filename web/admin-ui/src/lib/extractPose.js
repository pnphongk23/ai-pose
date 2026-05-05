'use client';

/**
 * Client-side edge detection as fallback when no Replicate API key.
 * Uses Canny-like edge detection via Canvas API.
 * 
 * For production, use the /api/extract endpoint with Replicate API.
 */

export async function extractPoseClientSide(imageFile, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onload = () => {
          onProgress?.(10);
          
          // Create canvas with image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          onProgress?.(30);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Convert to grayscale
          const gray = new Float32Array(canvas.width * canvas.height);
          for (let i = 0; i < data.length; i += 4) {
            gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }
          
          onProgress?.(50);
          
          // Apply Gaussian blur (3x3)
          const blurred = applyGaussianBlur(gray, canvas.width, canvas.height);
          
          onProgress?.(60);
          
          // Sobel edge detection
          const edges = applySobel(blurred, canvas.width, canvas.height);
          
          onProgress?.(80);
          
          // Create output: white edges on transparent background
          const outputCanvas = document.createElement('canvas');
          outputCanvas.width = canvas.width;
          outputCanvas.height = canvas.height;
          const outCtx = outputCanvas.getContext('2d');
          const outData = outCtx.createImageData(canvas.width, canvas.height);
          
          // Adaptive threshold
          const threshold = calculateAdaptiveThreshold(edges);
          
          for (let i = 0; i < edges.length; i++) {
            const idx = i * 4;
            if (edges[i] > threshold) {
              // White line with full opacity
              const intensity = Math.min(255, edges[i] * 2);
              outData.data[idx] = 255;     // R
              outData.data[idx + 1] = 255; // G
              outData.data[idx + 2] = 255; // B
              outData.data[idx + 3] = intensity; // A
            } else {
              // Transparent
              outData.data[idx] = 0;
              outData.data[idx + 1] = 0;
              outData.data[idx + 2] = 0;
              outData.data[idx + 3] = 0;
            }
          }
          
          outCtx.putImageData(outData, 0, 0);
          
          // Dilate lines to make them thicker
          dilateLines(outCtx, canvas.width, canvas.height);
          
          onProgress?.(95);
          
          outputCanvas.toBlob((blob) => {
            onProgress?.(100);
            resolve(blob);
          }, 'image/png');
        };
        img.src = e.target.result;
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

function applyGaussianBlur(data, width, height) {
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;
  const result = new Float32Array(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += data[(y + ky) * width + (x + kx)] * kernel[ki++];
        }
      }
      result[y * width + x] = sum / kSum;
    }
  }
  return result;
}

function applySobel(data, width, height) {
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const result = new Float32Array(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0, sumY = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const val = data[(y + ky) * width + (x + kx)];
          sumX += val * gx[ki];
          sumY += val * gy[ki];
          ki++;
        }
      }
      result[y * width + x] = Math.sqrt(sumX * sumX + sumY * sumY);
    }
  }
  return result;
}

function calculateAdaptiveThreshold(edges) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > 0) {
      sum += edges[i];
      count++;
    }
  }
  const mean = sum / count;
  return mean * 1.2; // Slightly above mean for cleaner lines
}

function dilateLines(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (copy[idx + 3] > 100) {
        // Dilate to neighboring pixels
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx + 3] < copy[idx + 3]) {
              data[nIdx] = 255;
              data[nIdx + 1] = 255;
              data[nIdx + 2] = 255;
              data[nIdx + 3] = Math.max(data[nIdx + 3], copy[idx + 3] * 0.7);
            }
          }
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Extract pose via server API (Replicate).
 * Falls back to client-side if API fails.
 */
export async function extractPoseServer(imageFile, onProgress) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  onProgress?.(10);
  
  try {
    const res = await fetch('/api/extract', {
      method: 'POST',
      body: formData,
    });
    
    onProgress?.(70);
    
    if (!res.ok) {
      const err = await res.json();
      // Fall back to client-side if API key missing
      if (err.fallback) {
        console.log('Falling back to client-side extraction');
        return extractPoseClientSide(imageFile, onProgress);
      }
      throw new Error(err.error || 'Extract failed');
    }
    
    const { lineartBase64 } = await res.json();
    onProgress?.(90);
    
    // Convert base64 to blob
    const byteString = atob(lineartBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/png' });
    
    onProgress?.(100);
    return blob;
  } catch (err) {
    console.warn('Server extraction failed, using client-side:', err);
    return extractPoseClientSide(imageFile, onProgress);
  }
}
