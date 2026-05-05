import { callPoseExtractAdmin } from '@/lib/poseExtractAdminServer';
import { mapProxyError } from '../../proxyError';

export async function GET(request) {
  try {
    const { search } = new URL(request.url);
    const result = await callPoseExtractAdmin(`/api/admin/community/poses${search}`);
    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json(
        {
          error: 'Unsupported Content-Type. Use multipart/form-data for community pose submission.',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const result = await callPoseExtractAdmin('/api/admin/community/poses', {
      method: 'POST',
      body: formData,
    });

    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}
