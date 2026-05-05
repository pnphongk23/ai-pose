import { callPoseExtractAdmin } from '@/lib/poseExtractAdminServer';

function mapProxyError(error) {
  return Response.json(
    {
      error: error.message || 'Proxy request failed',
      code: 'ADMIN_PROXY_ERROR',
    },
    { status: 500 }
  );
}

export async function POST() {
  try {
    const result = await callPoseExtractAdmin('/api/admin/keys/reset', {
      method: 'POST',
    });
    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}
