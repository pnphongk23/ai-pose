const DEFAULT_TIMEOUT_MS = 20000;

function getAdminConfig() {
  const baseUrl = process.env.POSE_EXTRACT_SERVER_URL;
  const adminSecret = process.env.POSE_EXTRACT_ADMIN_SECRET || process.env.ADMIN_SECRET;

  if (!baseUrl) {
    throw new Error('Missing POSE_EXTRACT_SERVER_URL');
  }

  if (!adminSecret) {
    throw new Error('Missing POSE_EXTRACT_ADMIN_SECRET (or ADMIN_SECRET fallback)');
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    adminSecret,
  };
}

export async function callPoseExtractAdmin(pathname, options = {}) {
  const { baseUrl, adminSecret } = getAdminConfig();
  const { method = 'GET', body } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${adminSecret}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });

    const rawText = await response.text();
    let payload = {};

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { error: rawText };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}
