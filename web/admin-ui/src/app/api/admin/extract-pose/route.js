import { callPoseExtractExtractPose } from '@/lib/poseExtractExtractPoseProxy';
import { mapProxyError } from '../proxyError';

export async function POST(request) {
  try {
    const incoming = await request.formData();
    const image = incoming.get('image');

    if (!image || typeof image === 'string') {
      return Response.json(
        {
          error: {
            code: 'INVALID_IMAGE',
            message: 'Image file is required (JPEG/PNG, field name: image)',
          },
        },
        { status: 400 }
      );
    }

    const forward = new FormData();
    forward.append('image', image, image.name || 'upload.png');

    const result = await callPoseExtractExtractPose(forward, {
      requestUrl: request.url,
    });

    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}
