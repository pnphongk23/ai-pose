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

export async function GET() {
  try {
    const result = await callPoseExtractAdmin('/api/admin/keys');
    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await callPoseExtractAdmin('/api/admin/keys', {
      method: 'POST',
      body,
    });
    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}
