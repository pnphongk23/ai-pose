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

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const result = await callPoseExtractAdmin(`/api/admin/keys/${id}`, {
      method: 'PATCH',
      body,
    });
    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = params;
    const result = await callPoseExtractAdmin(`/api/admin/keys/${id}`, {
      method: 'DELETE',
    });
    return Response.json(result.payload, { status: result.status });
  } catch (error) {
    return mapProxyError(error);
  }
}
