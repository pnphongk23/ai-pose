export function mapProxyError(error) {
  const rawMessage = error?.message || 'Proxy request failed';
  const isMisconfig =
    rawMessage.includes('POSE_EXTRACT_SERVER_URL') ||
    rawMessage.includes('POSE_EXTRACT_ADMIN_SECRET') ||
    rawMessage.includes('ADMIN_SECRET') ||
    rawMessage.includes('Invalid POSE_EXTRACT_SERVER_URL') ||
    rawMessage.includes('recursive proxy calls');

  return Response.json(
    {
      error: isMisconfig
        ? 'Admin proxy đang cấu hình sai. Kiểm tra POSE_EXTRACT_SERVER_URL và POSE_EXTRACT_ADMIN_SECRET.'
        : rawMessage,
      code: isMisconfig ? 'ADMIN_PROXY_MISCONFIG' : 'ADMIN_PROXY_ERROR',
    },
    { status: 500 }
  );
}
