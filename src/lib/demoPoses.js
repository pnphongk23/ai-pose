'use client';

/**
 * Generate demo stick figure poses as canvas-drawn PNG blobs.
 * Used for community poses that don't have real AI-extracted data.
 */

const POSE_CONFIGS = {
  STANDING: {
    head: { x: 0.5, y: 0.12 },
    neck: { x: 0.5, y: 0.2 },
    shoulders: [{ x: 0.38, y: 0.22 }, { x: 0.62, y: 0.22 }],
    elbows: [{ x: 0.32, y: 0.36 }, { x: 0.68, y: 0.36 }],
    hands: [{ x: 0.3, y: 0.48 }, { x: 0.7, y: 0.48 }],
    hips: [{ x: 0.44, y: 0.5 }, { x: 0.56, y: 0.5 }],
    knees: [{ x: 0.42, y: 0.68 }, { x: 0.58, y: 0.68 }],
    feet: [{ x: 0.4, y: 0.88 }, { x: 0.6, y: 0.88 }],
  },
  DANCING: {
    head: { x: 0.48, y: 0.1 },
    neck: { x: 0.48, y: 0.18 },
    shoulders: [{ x: 0.36, y: 0.2 }, { x: 0.6, y: 0.2 }],
    elbows: [{ x: 0.25, y: 0.14 }, { x: 0.72, y: 0.3 }],
    hands: [{ x: 0.2, y: 0.06 }, { x: 0.8, y: 0.38 }],
    hips: [{ x: 0.42, y: 0.48 }, { x: 0.54, y: 0.48 }],
    knees: [{ x: 0.35, y: 0.65 }, { x: 0.62, y: 0.62 }],
    feet: [{ x: 0.3, y: 0.85 }, { x: 0.68, y: 0.8 }],
  },
  JUMPING: {
    head: { x: 0.5, y: 0.08 },
    neck: { x: 0.5, y: 0.16 },
    shoulders: [{ x: 0.38, y: 0.18 }, { x: 0.62, y: 0.18 }],
    elbows: [{ x: 0.28, y: 0.1 }, { x: 0.72, y: 0.1 }],
    hands: [{ x: 0.22, y: 0.02 }, { x: 0.78, y: 0.02 }],
    hips: [{ x: 0.44, y: 0.44 }, { x: 0.56, y: 0.44 }],
    knees: [{ x: 0.38, y: 0.58 }, { x: 0.62, y: 0.58 }],
    feet: [{ x: 0.35, y: 0.72 }, { x: 0.65, y: 0.72 }],
  },
  WALKING: {
    head: { x: 0.5, y: 0.1 },
    neck: { x: 0.5, y: 0.18 },
    shoulders: [{ x: 0.38, y: 0.2 }, { x: 0.62, y: 0.2 }],
    elbows: [{ x: 0.32, y: 0.34 }, { x: 0.68, y: 0.3 }],
    hands: [{ x: 0.28, y: 0.46 }, { x: 0.72, y: 0.42 }],
    hips: [{ x: 0.44, y: 0.48 }, { x: 0.56, y: 0.48 }],
    knees: [{ x: 0.38, y: 0.66 }, { x: 0.6, y: 0.64 }],
    feet: [{ x: 0.32, y: 0.86 }, { x: 0.64, y: 0.84 }],
  },
  'ARMS UP': {
    head: { x: 0.5, y: 0.15 },
    neck: { x: 0.5, y: 0.23 },
    shoulders: [{ x: 0.38, y: 0.25 }, { x: 0.62, y: 0.25 }],
    elbows: [{ x: 0.32, y: 0.14 }, { x: 0.68, y: 0.14 }],
    hands: [{ x: 0.28, y: 0.04 }, { x: 0.72, y: 0.04 }],
    hips: [{ x: 0.44, y: 0.52 }, { x: 0.56, y: 0.52 }],
    knees: [{ x: 0.42, y: 0.7 }, { x: 0.58, y: 0.7 }],
    feet: [{ x: 0.4, y: 0.9 }, { x: 0.6, y: 0.9 }],
  },
  SITTING: {
    head: { x: 0.5, y: 0.12 },
    neck: { x: 0.5, y: 0.2 },
    shoulders: [{ x: 0.38, y: 0.22 }, { x: 0.62, y: 0.22 }],
    elbows: [{ x: 0.3, y: 0.36 }, { x: 0.7, y: 0.36 }],
    hands: [{ x: 0.28, y: 0.48 }, { x: 0.72, y: 0.48 }],
    hips: [{ x: 0.44, y: 0.5 }, { x: 0.56, y: 0.5 }],
    knees: [{ x: 0.35, y: 0.6 }, { x: 0.65, y: 0.6 }],
    feet: [{ x: 0.3, y: 0.72 }, { x: 0.7, y: 0.72 }],
  },
};

export function generatePoseBlob(poseName, width = 600, height = 800) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Clear with transparency
    ctx.clearRect(0, 0, width, height);

    const config = POSE_CONFIGS[poseName] || POSE_CONFIGS.STANDING;

    // Drawing settings
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 8;

    const p = (point) => ({ x: point.x * width, y: point.y * height });

    // Draw head
    const head = p(config.head);
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Draw neck
    const neck = p(config.neck);
    drawLine(ctx, head.x, head.y + 18, neck.x, neck.y);

    // Draw spine (neck to mid-hips)
    const midHip = {
      x: (p(config.hips[0]).x + p(config.hips[1]).x) / 2,
      y: (p(config.hips[0]).y + p(config.hips[1]).y) / 2,
    };
    drawLine(ctx, neck.x, neck.y, midHip.x, midHip.y);

    // Draw shoulders
    const lShoulder = p(config.shoulders[0]);
    const rShoulder = p(config.shoulders[1]);
    drawLine(ctx, lShoulder.x, lShoulder.y, rShoulder.x, rShoulder.y);

    // Draw arms
    const lElbow = p(config.elbows[0]);
    const rElbow = p(config.elbows[1]);
    const lHand = p(config.hands[0]);
    const rHand = p(config.hands[1]);
    drawLine(ctx, lShoulder.x, lShoulder.y, lElbow.x, lElbow.y);
    drawLine(ctx, lElbow.x, lElbow.y, lHand.x, lHand.y);
    drawLine(ctx, rShoulder.x, rShoulder.y, rElbow.x, rElbow.y);
    drawLine(ctx, rElbow.x, rElbow.y, rHand.x, rHand.y);

    // Draw hip line
    const lHip = p(config.hips[0]);
    const rHip = p(config.hips[1]);
    drawLine(ctx, lHip.x, lHip.y, rHip.x, rHip.y);

    // Draw legs
    const lKnee = p(config.knees[0]);
    const rKnee = p(config.knees[1]);
    const lFoot = p(config.feet[0]);
    const rFoot = p(config.feet[1]);
    drawLine(ctx, lHip.x, lHip.y, lKnee.x, lKnee.y);
    drawLine(ctx, lKnee.x, lKnee.y, lFoot.x, lFoot.y);
    drawLine(ctx, rHip.x, rHip.y, rKnee.x, rKnee.y);
    drawLine(ctx, rKnee.x, rKnee.y, rFoot.x, rFoot.y);

    // Draw joints
    ctx.shadowBlur = 4;
    const joints = [
      ...config.shoulders, ...config.elbows, ...config.hands,
      ...config.hips, ...config.knees, ...config.feet,
    ].map(p);

    joints.forEach((joint) => {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
