const base = () => import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const response = await fetch(`${base()}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message ?? data?.raw ?? `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return data;
}
